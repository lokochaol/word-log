import { prisma } from "@/lib/db";
import { DiscoveryKind, DiscoveryStatus } from "@/generated/prisma/client";
import { NotFoundError } from "@/lib/errors";
import * as quickNotes from "@/lib/quickNotes";
import type { QuickNoteDetail } from "@/lib/quickNotes";

export interface DiscoveryCandidateSummary {
  id: string;
  quickNoteId: string;
  kind: DiscoveryKind;
  status: DiscoveryStatus;
  title: string;
  summary: string;
  sourceLabel: string;
  url: string | null;
  confidence: number;
  literatureMemoId: string | null;
}

interface DiscoveryCandidateRow {
  id: string;
  quickNoteId: string;
  kind: DiscoveryKind;
  status: DiscoveryStatus;
  title: string;
  summary: string;
  sourceLabel: string;
  url: string | null;
  confidence: number;
  literatureMemoId: string | null;
}

function toSummary(row: DiscoveryCandidateRow): DiscoveryCandidateSummary {
  return {
    id: row.id,
    quickNoteId: row.quickNoteId,
    kind: row.kind,
    status: row.status,
    title: row.title,
    summary: row.summary,
    sourceLabel: row.sourceLabel,
    url: row.url,
    confidence: row.confidence,
    literatureMemoId: row.literatureMemoId,
  };
}

/** All candidates for a set of active QuickNotes, grouped by quickNoteId —
 * highest-confidence first, so a shelf's horizontal scroll leads with its
 * best matches. */
export async function listForQuickNotes(
  ownerSub: string,
  quickNoteIds: string[],
): Promise<Record<string, DiscoveryCandidateSummary[]>> {
  if (quickNoteIds.length === 0) return {};
  const rows = await prisma.discoveryCandidate.findMany({
    where: { ownerSub, quickNoteId: { in: quickNoteIds } },
    orderBy: [{ confidence: "desc" }, { createdAt: "asc" }],
  });
  const byNote: Record<string, DiscoveryCandidateSummary[]> = {};
  for (const row of rows) {
    (byNote[row.quickNoteId] ??= []).push(toSummary(row));
  }
  return byNote;
}

async function requireOwnedCandidate(ownerSub: string, id: string) {
  const candidate = await prisma.discoveryCandidate.findFirst({ where: { id, ownerSub } });
  if (!candidate) throw new NotFoundError("discoveryCandidateNotFound", `DiscoveryCandidate not found: ${id}`);
  return candidate;
}

export interface DiscoveryFinding {
  kind: DiscoveryKind;
  title: string;
  summary: string;
  sourceLabel: string;
  url: string | null;
  /** 0-100 — the app never re-judges this once found; it's shown as-is next
   * to the "AI候補" badge until the owner confirms it (see resolveLiteratureForCandidate). */
  confidence: number;
}

/**
 * STUB. This is the one piece of the "Discovery Rails" pipeline that needs a
 * real search/LLM provider wired in — everything downstream of this
 * function's return value (storage, URL-keyed dedup, the confirm/write
 * flow, the shelf UI) is real and already wired up. Until a provider is
 * chosen, this always returns no findings, so the twice-daily batch runs
 * without error but surfaces nothing.
 */
export async function findCandidatesForNote(_noteText: string): Promise<DiscoveryFinding[]> {
  return [];
}

/** Runs discovery for one note and stores whatever findCandidatesForNote
 * returns. Returns the number of candidates created. */
export async function runForQuickNote(ownerSub: string, quickNoteId: string): Promise<number> {
  const note = await quickNotes.getDetail(ownerSub, quickNoteId);
  const text = note.blocks.map((b) => b.content).join("\n\n").trim();
  if (!text) return 0;

  const findings = await findCandidatesForNote(text);
  if (findings.length === 0) return 0;

  await prisma.discoveryCandidate.createMany({
    data: findings.map((f) => ({
      ownerSub,
      quickNoteId,
      kind: f.kind,
      title: f.title,
      summary: f.summary,
      sourceLabel: f.sourceLabel,
      url: f.url,
      confidence: f.confidence,
    })),
  });
  return findings.length;
}

/** Runs discovery across every active QuickNote for one owner — what both
 * the manual "今すぐ探す" trigger and the twice-daily cron call. */
export async function runForActiveNotes(ownerSub: string): Promise<{ notesChecked: number; candidatesFound: number }> {
  const notes = await quickNotes.listActive(ownerSub);
  let candidatesFound = 0;
  for (const note of notes) {
    candidatesFound += await runForQuickNote(ownerSub, note.id);
  }
  return { notesChecked: notes.length, candidatesFound };
}

/** Every owner with at least one active QuickNote — the cron route fans
 * runForActiveNotes out across all tenants with this. */
export async function listOwnersWithActiveNotes(): Promise<string[]> {
  const rows = await prisma.quickNote.findMany({
    where: { status: "ACTIVE" },
    distinct: ["ownerSub"],
    select: { ownerSub: true },
  });
  return rows.map((r) => r.ownerSub);
}

/**
 * Finds-or-creates the LiteratureMemo behind a candidate, keyed by URL —
 * candidates never carry a zoteroKey, so this is the dedup key instead. The
 * same article surfacing again (a later batch, or from a different note)
 * reuses the existing memo rather than creating a duplicate. Citation/url
 * can be edited by the owner before this runs (the shelf's detail view
 * pre-fills them from the candidate but lets them be corrected first).
 * Flips the candidate to CONFIRMED — this is the only thing that does.
 */
export async function resolveLiteratureForCandidate(
  ownerSub: string,
  candidateId: string,
  overrides: { citation: string; url: string | null },
): Promise<string> {
  const candidate = await requireOwnedCandidate(ownerSub, candidateId);
  if (candidate.literatureMemoId) return candidate.literatureMemoId;

  const citation = overrides.citation.trim() || candidate.title;
  const url = overrides.url?.trim() || null;

  const existing = url ? await prisma.literatureMemo.findFirst({ where: { ownerSub, url } }) : null;
  const literatureMemoId = existing
    ? existing.id
    : (await prisma.literatureMemo.create({ data: { ownerSub, zoteroKey: null, citation, url, summary: null } })).id;

  await prisma.discoveryCandidate.update({
    where: { id: candidateId },
    data: { literatureMemoId, status: "CONFIRMED" },
  });

  return literatureMemoId;
}

/** Creates a new QuickNote already linked to the candidate's (resolved)
 * literature memo, and lands it on the real /scratch/[id] editor — no
 * separate inline editor is built for this; it's the exact same
 * create-then-navigate flow as AddQuickNoteButton. */
export async function writeNoteFromCandidate(
  ownerSub: string,
  candidateId: string,
  overrides: { citation: string; url: string | null },
): Promise<QuickNoteDetail> {
  const literatureMemoId = await resolveLiteratureForCandidate(ownerSub, candidateId, overrides);
  return quickNotes.create(ownerSub, "SCRATCH", literatureMemoId);
}
