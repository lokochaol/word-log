import { prisma } from "@/lib/db";
import { Prisma, QuickNoteSource, QuickNoteStatus } from "@/generated/prisma/client";
import { NotFoundError } from "@/lib/errors";
import type { Block, BlockInput } from "@/lib/blocks";

export type { Block, BlockInput, BlockType } from "@/lib/blocks";

export interface QuickNoteSummary {
  id: string;
  source: QuickNoteSource;
  encounteredAt: Date;
  /** First TEXT block's content, for a one-line summary in timelines/pickers. */
  preview: string;
  hasLiterature: boolean;
}

export interface QuickNoteDetail {
  id: string;
  source: QuickNoteSource;
  status: QuickNoteStatus;
  blocks: Block[];
  literatureCitation: string | null;
  literatureUrl: string | null;
  literatureZoteroKey: string | null;
  literatureSummary: string | null;
  encounteredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const quickNoteInclude = {
  blocks: { orderBy: { position: "asc" } },
} satisfies Prisma.QuickNoteInclude;

type QuickNoteWithBlocks = Prisma.QuickNoteGetPayload<{ include: typeof quickNoteInclude }>;

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
    literatureCitation: note.literatureCitation,
    literatureUrl: note.literatureUrl,
    literatureZoteroKey: note.literatureZoteroKey,
    literatureSummary: note.literatureSummary,
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
    hasLiterature: !!note.literatureCitation,
  };
}

/** Internal ownership gate — every mutation and detail read goes through this first. */
export async function requireOwnedQuickNote(ownerSub: string, id: string): Promise<QuickNoteWithBlocks> {
  const note = await prisma.quickNote.findFirst({
    where: { id, ownerSub },
    include: quickNoteInclude,
  });
  if (!note) throw new NotFoundError(`QuickNote not found: ${id}`);
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

export async function create(ownerSub: string, source: QuickNoteSource = "SCRATCH"): Promise<QuickNoteDetail> {
  const note = await prisma.quickNote.create({
    data: { ownerSub, source },
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
  literature: {
    citation: string | null;
    url: string | null;
    zoteroKey: string | null;
    summary: string | null;
  },
): Promise<QuickNoteDetail> {
  await requireOwnedQuickNote(ownerSub, id);

  await prisma.quickNote.update({
    where: { id },
    data: {
      literatureCitation: literature.citation || null,
      literatureUrl: literature.url || null,
      literatureZoteroKey: literature.zoteroKey || null,
      literatureSummary: literature.summary || null,
    },
  });

  return toDetail(await requireOwnedQuickNote(ownerSub, id));
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
