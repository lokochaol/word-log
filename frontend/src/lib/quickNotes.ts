import { prisma } from "@/lib/db";
import { Prisma, QuickNoteSource, QuickNoteStatus } from "@/generated/prisma/client";
import { NotFoundError } from "@/lib/errors";
import type { Block, BlockInput } from "@/lib/blocks";
import * as literatureMemos from "@/lib/literatureMemos";
import type { LiteratureMemoRef, LiteratureSelection } from "@/lib/literatureMemos";

export type { Block, BlockInput, BlockType } from "@/lib/blocks";
export type { LiteratureMemoRef } from "@/lib/literatureMemos";

export interface QuickNoteSummary {
  id: string;
  source: QuickNoteSource;
  encounteredAt: Date;
  /** First TEXT block's content, for a one-line summary in timelines/pickers. */
  preview: string;
  hasLiterature: boolean;
  /** Linked LiteratureMemo's citation, if any — shown inline on the /scratch timeline card. */
  literatureCitation: string | null;
}

export interface QuickNoteDetail {
  id: string;
  source: QuickNoteSource;
  status: QuickNoteStatus;
  blocks: Block[];
  literatureMemo: LiteratureMemoRef | null;
  encounteredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const quickNoteInclude = {
  blocks: { orderBy: { position: "asc" } },
  literatureMemo: true,
} satisfies Prisma.QuickNoteInclude;

type QuickNoteWithBlocks = Prisma.QuickNoteGetPayload<{ include: typeof quickNoteInclude }>;

function toLiteratureMemoRef(memo: QuickNoteWithBlocks["literatureMemo"]): LiteratureMemoRef | null {
  if (!memo) return null;
  return { id: memo.id, zoteroKey: memo.zoteroKey, citation: memo.citation, url: memo.url, summary: memo.summary };
}

function toDetail(note: QuickNoteWithBlocks): QuickNoteDetail {
  return {
    id: note.id,
    source: note.source,
    status: note.status,
    blocks: note.blocks.map((b) => ({
      id: b.id,
      type: b.type,
      content: b.content,
      language: b.language,
      caption: b.caption,
    })),
    literatureMemo: toLiteratureMemoRef(note.literatureMemo),
    encounteredAt: note.encounteredAt,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

function toSummary(note: QuickNoteWithBlocks): QuickNoteSummary {
  const firstText = note.blocks.find((b) => b.content.trim().length > 0);
  return {
    id: note.id,
    source: note.source,
    encounteredAt: note.encounteredAt,
    preview: firstText?.content.slice(0, 200) ?? "",
    hasLiterature: !!note.literatureMemo,
    literatureCitation: note.literatureMemo?.citation ?? null,
  };
}

/** Internal ownership gate — every mutation and detail read goes through this first. */
export async function requireOwnedQuickNote(ownerSub: string, id: string): Promise<QuickNoteWithBlocks> {
  const note = await prisma.quickNote.findFirst({
    where: { id, ownerSub },
    include: quickNoteInclude,
  });
  if (!note) throw new NotFoundError("quickNoteNotFound", `QuickNote not found: ${id}`);
  return note;
}

export async function listActive(ownerSub: string): Promise<QuickNoteSummary[]> {
  const notes = await prisma.quickNote.findMany({
    where: { ownerSub, status: "ACTIVE" },
    orderBy: [{ encounteredAt: "asc" }, { createdAt: "asc" }],
    include: quickNoteInclude,
  });
  return notes.map(toSummary);
}

export async function getDetail(ownerSub: string, id: string): Promise<QuickNoteDetail> {
  const note = await requireOwnedQuickNote(ownerSub, id);
  return toDetail(note);
}

export async function create(
  ownerSub: string,
  source: QuickNoteSource = "SCRATCH",
  literatureMemoId?: string,
): Promise<QuickNoteDetail> {
  const note = await prisma.quickNote.create({
    data: { ownerSub, source, literatureMemoId },
    include: quickNoteInclude,
  });
  return toDetail(note);
}

export async function replaceBlocks(ownerSub: string, id: string, blocks: BlockInput[]): Promise<QuickNoteDetail> {
  await requireOwnedQuickNote(ownerSub, id);

  await prisma.$transaction([
    prisma.quickNoteBlock.deleteMany({ where: { quickNoteId: id } }),
    prisma.quickNote.update({
      where: { id },
      data: {
        blocks: {
          create: blocks.map((b, i) => ({
            position: i,
            type: b.type,
            content: b.content,
            language: b.language || null,
            caption: b.caption || null,
          })),
        },
      },
    }),
  ]);

  return toDetail(await requireOwnedQuickNote(ownerSub, id));
}

export async function setLiteratureMemo(
  ownerSub: string,
  id: string,
  selection: LiteratureSelection,
): Promise<QuickNoteDetail> {
  await requireOwnedQuickNote(ownerSub, id);

  const literatureMemoId = await literatureMemos.resolveSelection(prisma, ownerSub, selection);
  await prisma.quickNote.update({
    where: { id },
    data: { literatureMemoId },
  });

  return toDetail(await requireOwnedQuickNote(ownerSub, id));
}

/** Hard-deletes a still-active QuickNote (blocks cascade). Once a note is
 * ARCHIVED (promoted), it's part of a PromotionBatch's history and this
 * isn't exposed for it — deletion is only meant for the active timeline. */
export async function remove(ownerSub: string, id: string): Promise<void> {
  await requireOwnedQuickNote(ownerSub, id);
  await prisma.quickNote.delete({ where: { id } });
}

/** Internal only — called exclusively from the promotion transaction (src/lib/promotion.ts). */
export async function archiveMany(
  tx: Prisma.TransactionClient,
  ownerSub: string,
  ids: string[],
): Promise<void> {
  await tx.quickNote.updateMany({
    where: { id: { in: ids }, ownerSub },
    data: { status: "ARCHIVED" },
  });
}

/** Full-text-ish search across a quick note's block contents, scoped to the owner, active notes only. */
export async function search(ownerSub: string, query: string, limit = 20): Promise<QuickNoteSummary[]> {
  const q = query.trim();
  if (!q) return [];

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT DISTINCT qn.id,
      GREATEST(
        MAX(COALESCE(similarity(qb.content, ${q}), 0)),
        CASE WHEN bool_or(qb.content ILIKE ${"%" + q + "%"}) THEN 0.9 ELSE 0 END
      ) AS rank
    FROM quick_note qn
    JOIN quick_note_block qb ON qb.quick_note_id = qn.id
    WHERE qn.owner_sub = ${ownerSub} AND qn.status = 'ACTIVE'
      AND (qb.content % ${q} OR qb.content ILIKE ${"%" + q + "%"})
    GROUP BY qn.id
    ORDER BY rank DESC
    LIMIT ${limit}
  `;
  if (rows.length === 0) return [];

  const notes = await prisma.quickNote.findMany({
    where: { id: { in: rows.map((r) => r.id) } },
    include: quickNoteInclude,
  });
  const byId = new Map(notes.map((n) => [n.id, n]));
  return rows.map((r) => toSummary(byId.get(r.id)!)).filter(Boolean);
}
