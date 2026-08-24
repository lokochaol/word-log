import { prisma } from "@/lib/db";
import { DiscoveryKind, DiscoveryStatus } from "@/generated/prisma/client";
import { NotFoundError } from "@/lib/errors";
import * as quickNotes from "@/lib/quickNotes";
import type { QuickNoteDetail } from "@/lib/quickNotes";
import * as aiCredentials from "@/lib/aiCredentials";
import { AiProvider } from "@/lib/aiCredentials";

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

// Cheapest current-gen model per provider — this task is "search +
// summarize + score", not deep reasoning, and it runs unattended across
// every active note, on the *owner's own* API key.
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const OPENAI_MODEL = "gpt-5-mini";
const GOOGLE_MODEL = "gemini-2.5-flash";
// Capped per note (not just per run) since a web-search tool call is
// typically billed per search performed — this bounds worst-case spend for
// one note regardless of how much the model might otherwise want to search.
const MAX_SEARCHES_PER_NOTE = 2;
// A note is only ever sent to the model once, ever (see the "already
// searched" filter in runForActiveNotes) — the real cost control isn't a
// cap on searches, it's never re-searching a note that was already checked.
const MAX_NOTES_PER_RUN = 15;

const DISCOVERY_SYSTEM_PROMPT = `あなたはユーザーの走り書きメモを読み、関連しそうな最新ニュースと文献（書籍・論文など）をWeb検索で探すアシスタントです。

手順:
1. 与えられたメモの内容を理解する。
2. Web検索ツールを使って、内容に関連する最新ニュースを最大3件、関連する文献（書籍・論文など）を最大3件探す。
3. 実在するURLが確認できたものだけ url に入れる。確認できなければ null にする。
4. メモとの関連度を0〜100の整数で見積もる（確信が持てない場合は低めに見積もる）。
5. 何も見つからなければ無理に候補を作らない。

出力は次のJSON配列のみ。説明文・前置き・コードフェンスは一切書かないこと（kindは"NEWS"か"LITERATURE"のどちらか、urlは実在URLの文字列かnull）:
[{"kind":"NEWS","title":"...","summary":"（1〜2文の要約、メモと同じ言語で）","sourceLabel":"（媒体名と相対時刻、または書籍/論文などの種別や著者・年）","url":"https://...またはnull","confidence":0から100の整数}]

関連するものが見つからない場合は空配列 [] を出力する。`;

function normalizeFinding(item: Record<string, unknown>): DiscoveryFinding | null {
  const kind =
    item.kind === "NEWS" ? DiscoveryKind.NEWS : item.kind === "LITERATURE" ? DiscoveryKind.LITERATURE : null;
  const title = typeof item.title === "string" ? item.title.trim() : "";
  if (!kind || !title) return null;

  const summary = typeof item.summary === "string" ? item.summary.trim() : "";
  const sourceLabel = typeof item.sourceLabel === "string" ? item.sourceLabel.trim() : "";
  const url = typeof item.url === "string" && item.url.trim() ? item.url.trim() : null;
  const confidenceRaw = typeof item.confidence === "number" ? item.confidence : Number(item.confidence);
  const confidence = Number.isFinite(confidenceRaw) ? Math.max(0, Math.min(100, Math.round(confidenceRaw))) : 50;

  return { kind, title, summary, sourceLabel, url, confidence };
}

/** Shared across all three providers: extract the first JSON array literal
 * from the model's final text output and turn it into findings. Never
 * throws — malformed output just yields no findings. */
function parseFindings(text: string | undefined | null): DiscoveryFinding[] {
  if (!text) return [];
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    const parsed: unknown = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map(normalizeFinding)
      .filter((f): f is DiscoveryFinding => f !== null)
      .slice(0, 6);
  } catch {
    return [];
  }
}

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

/**
 * Calls the Anthropic Messages API with the server-side web_search tool —
 * one call does "search the web for what's relevant, then summarize and
 * score it" in one shot; Anthropic runs the search loop server-side, so this
 * is a single request, not a client-managed tool loop.
 */
async function findViaAnthropic(apiKey: string, noteText: string): Promise<DiscoveryFinding[]> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 800,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: MAX_SEARCHES_PER_NOTE }],
      system: DISCOVERY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: noteText }],
    }),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { content?: AnthropicContentBlock[] };
  const textBlocks = (data.content ?? []).filter((b) => b.type === "text" && b.text);
  return parseFindings(textBlocks[textBlocks.length - 1]?.text);
}

interface OpenAiOutputItem {
  type: string;
  content?: Array<{ type: string; text?: string }>;
}

/**
 * Calls OpenAI's Responses API with its built-in web_search tool — same
 * "one request, server-side search loop" shape as Anthropic's. NOTE: tool
 * and model names on OpenAI's side move fast; verify `web_search` and
 * `gpt-5-mini` are still current in OpenAI's docs before relying on this —
 * this was written against the API shape known at implementation time and
 * hasn't been exercised against a live key in this environment.
 */
async function findViaOpenAi(apiKey: string, noteText: string): Promise<DiscoveryFinding[]> {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        { role: "system", content: DISCOVERY_SYSTEM_PROMPT },
        { role: "user", content: noteText },
      ],
      tools: [{ type: "web_search" }],
    }),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { output?: OpenAiOutputItem[] };
  const messages = (data.output ?? []).filter((o) => o.type === "message");
  const lastMessage = messages[messages.length - 1];
  const textPart = lastMessage?.content?.find((c) => c.type === "output_text" || c.type === "text");
  return parseFindings(textPart?.text);
}

interface GeminiCandidate {
  content?: { parts?: Array<{ text?: string }> };
}

/**
 * Calls Google's Gemini API with Grounding with Google Search. NOTE: same
 * caveat as findViaOpenAi — Gemini's grounding tool shape has changed before
 * (`googleSearchRetrieval` → `googleSearch`); verify against current Gemini
 * docs if this stops finding anything.
 */
async function findViaGoogle(apiKey: string, noteText: string): Promise<DiscoveryFinding[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: DISCOVERY_SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: noteText }] }],
        tools: [{ googleSearch: {} }],
      }),
    },
  );
  if (!res.ok) return [];

  const data = (await res.json()) as { candidates?: GeminiCandidate[] };
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text)
    .filter(Boolean)
    .join("\n");
  return parseFindings(text);
}

/**
 * Dispatches to whichever provider the owner configured in Settings (see
 * AiSettingsForm / aiCredentials.ts) — there is no app-wide default key.
 * Never throws: no credential, a failed request, or unparseable output all
 * resolve to no findings rather than breaking the batch run for other notes.
 */
export async function findCandidatesForNote(ownerSub: string, noteText: string): Promise<DiscoveryFinding[]> {
  const credential = await aiCredentials.get(ownerSub);
  if (!credential) return [];

  const text = noteText.slice(0, 2000);
  try {
    switch (credential.provider) {
      case AiProvider.ANTHROPIC:
        return await findViaAnthropic(credential.apiKey, text);
      case AiProvider.OPENAI:
        return await findViaOpenAi(credential.apiKey, text);
      case AiProvider.GOOGLE:
        return await findViaGoogle(credential.apiKey, text);
      default:
        return [];
    }
  } catch {
    return [];
  }
}

/** Runs discovery for one note and stores whatever findCandidatesForNote
 * returns. Returns the number of candidates created. */
export async function runForQuickNote(ownerSub: string, quickNoteId: string): Promise<number> {
  const note = await quickNotes.getDetail(ownerSub, quickNoteId);
  const text = note.blocks.map((b) => b.content).join("\n\n").trim();
  if (!text) return 0;

  const findings = await findCandidatesForNote(ownerSub, text);
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

/** Runs discovery across an owner's active QuickNotes — what both the
 * manual "今すぐ探す" trigger and the twice-daily cron call. A note is only
 * ever sent to the model once (searched := already has ≥1 candidate, of any
 * status), so re-running this repeatedly never re-spends on unchanged
 * notes — cost scales with how many *new* notes were written, not with how
 * often the batch fires. Also caps how many never-searched notes one run
 * will attempt, so a large backlog trickles across runs instead of spiking
 * one run's cost. */
export async function runForActiveNotes(ownerSub: string): Promise<{ notesChecked: number; candidatesFound: number }> {
  const notes = await quickNotes.listActive(ownerSub);
  if (notes.length === 0) return { notesChecked: 0, candidatesFound: 0 };

  const searched = await prisma.discoveryCandidate.findMany({
    where: { ownerSub, quickNoteId: { in: notes.map((n) => n.id) } },
    select: { quickNoteId: true },
    distinct: ["quickNoteId"],
  });
  const alreadySearched = new Set(searched.map((r) => r.quickNoteId));
  const pending = notes.filter((n) => !alreadySearched.has(n.id)).slice(0, MAX_NOTES_PER_RUN);

  let candidatesFound = 0;
  for (const note of pending) {
    candidatesFound += await runForQuickNote(ownerSub, note.id);
  }
  return { notesChecked: pending.length, candidatesFound };
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
