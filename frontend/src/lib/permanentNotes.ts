import { prisma } from "@/lib/db";
import { Prisma, LinkTargetType } from "@/generated/prisma/client";
import { NotFoundError } from "@/lib/errors";
import { midpointRank } from "@/lib/rank";
import type { Block, BlockType } from "@/lib/blocks";
import * as literatureMemos from "@/lib/literatureMemos";
import type { LiteratureMemoRef, LiteratureSelection } from "@/lib/literatureMemos";

export interface GlobalOrderEntry {
  id: string;
  title: string;
  orderKey: string;
}

export interface LinkView {
  id: string;
  relationLabel: string;
  targetType: LinkTargetType;
  /** The target's title (PermanentNote) or keyword (IndexEntry) — secondary annotation text. */
  targetLabel: string;
  targetNoteId: string | null;
  targetIndexEntryId: string | null;
}

export interface IndexEntryRefView {
  id: string;
  keyword: string;
}

export interface PermanentNoteDetail {
  id: string;
  title: string;
  orderKey: string;
  blocks: Block[];
  outboundLinks: LinkView[];
  inboundLinks: LinkView[];
  indexEntries: IndexEntryRefView[];
  literatureMemos: LiteratureMemoRef[];
  createdAt: Date;
  updatedAt: Date;
}

const detailInclude = {
  blocks: { orderBy: { position: "asc" } },
  outboundLinks: { include: { targetNote: true, targetIndexEntry: true } },
  inboundLinks: { include: { sourceNote: true } },
  indexEntries: true,
  literatureMemos: { include: { literatureMemo: true }, orderBy: { createdAt: "asc" } },
} satisfies Prisma.PermanentNoteInclude;

type PermanentNoteWithDetail = Prisma.PermanentNoteGetPayload<{ include: typeof detailInclude }>;

function toDetail(note: PermanentNoteWithDetail): PermanentNoteDetail {
  return {
    id: note.id,
    title: note.title,
    orderKey: note.orderKey,
    blocks: note.blocks.map((b) => ({
      id: b.id,
      type: b.type as BlockType,
      content: b.content,
      language: b.language,
      caption: b.caption,
    })),
    outboundLinks: note.outboundLinks.map((l) => ({
      id: l.id,
      relationLabel: l.relationLabel,
      targetType: l.targetType,
      targetLabel: l.targetType === "PERMANENT_NOTE" ? (l.targetNote?.title ?? "") : (l.targetIndexEntry?.keyword ?? ""),
      targetNoteId: l.targetNoteId,
      targetIndexEntryId: l.targetIndexEntryId,
    })),
    inboundLinks: note.inboundLinks.map((l) => ({
      id: l.id,
      relationLabel: l.relationLabel,
      targetType: l.targetType,
      targetLabel: l.sourceNote.title,
      targetNoteId: l.sourceNoteId,
      targetIndexEntryId: null,
    })),
    indexEntries: note.indexEntries.map((e) => ({ id: e.id, keyword: e.keyword })),
    literatureMemos: note.literatureMemos.map((l) => ({
      id: l.literatureMemo.id,
      zoteroKey: l.literatureMemo.zoteroKey,
      citation: l.literatureMemo.citation,
      url: l.literatureMemo.url,
      summary: l.literatureMemo.summary,
    })),
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

export async function requireOwnedPermanentNote(ownerSub: string, id: string): Promise<PermanentNoteWithDetail> {
  const note = await prisma.permanentNote.findFirst({
    where: { id, ownerSub },
    include: detailInclude,
  });
  if (!note) throw new NotFoundError("permanentNoteNotFound", `PermanentNote not found: ${id}`);
  return note;
}

/** The full owner-wide order, flat, for the pile grid's data source. */
export async function getGlobalOrder(ownerSub: string): Promise<GlobalOrderEntry[]> {
  return prisma.permanentNote.findMany({
    where: { ownerSub },
    orderBy: { orderKey: "asc" },
    select: { id: true, title: true, orderKey: true },
  });
}

export async function getDetail(ownerSub: string, id: string): Promise<PermanentNoteDetail> {
  const note = await requireOwnedPermanentNote(ownerSub, id);
  return toDetail(note);
}

/** Thin wrapper around rank.midpointRank that resolves the actual neighboring ranks first. */
export async function insertRank(ownerSub: string, beforeId: string | null, afterId: string | null): Promise<string> {
  const [before, after] = await Promise.all([
    beforeId ? prisma.permanentNote.findFirst({ where: { id: beforeId, ownerSub }, select: { orderKey: true } }) : null,
    afterId ? prisma.permanentNote.findFirst({ where: { id: afterId, ownerSub }, select: { orderKey: true } }) : null,
  ]);
  if (beforeId && !before) throw new NotFoundError("permanentNoteNotFound", `PermanentNote not found: ${beforeId}`);
  if (afterId && !after) throw new NotFoundError("permanentNoteNotFound", `PermanentNote not found: ${afterId}`);
  return midpointRank(before?.orderKey ?? null, after?.orderKey ?? null);
}

export async function addLink(
  ownerSub: string,
  sourceNoteId: string,
  target: { type: "PERMANENT_NOTE"; noteId: string } | { type: "INDEX_ENTRY"; indexEntryId: string },
  relationLabel: string,
): Promise<PermanentNoteDetail> {
  await requireOwnedPermanentNote(ownerSub, sourceNoteId);

  if (target.type === "PERMANENT_NOTE") {
    await requireOwnedPermanentNote(ownerSub, target.noteId);
    await prisma.permanentNoteLink.create({
      data: {
        sourceNoteId,
        targetType: "PERMANENT_NOTE",
        targetNoteId: target.noteId,
        relationLabel,
      },
    });
  } else {
    const entry = await prisma.indexEntry.findFirst({ where: { id: target.indexEntryId, ownerSub } });
    if (!entry) throw new NotFoundError("indexEntryNotFound", `IndexEntry not found: ${target.indexEntryId}`);
    await prisma.permanentNoteLink.create({
      data: {
        sourceNoteId,
        targetType: "INDEX_ENTRY",
        targetIndexEntryId: target.indexEntryId,
        relationLabel,
      },
    });
  }

  return toDetail(await requireOwnedPermanentNote(ownerSub, sourceNoteId));
}

export async function removeLink(ownerSub: string, sourceNoteId: string, linkId: string): Promise<void> {
  const note = await requireOwnedPermanentNote(ownerSub, sourceNoteId);
  const link = note.outboundLinks.find((l) => l.id === linkId);
  if (!link) throw new NotFoundError("linkNotFound", "Link not found");
  await prisma.permanentNoteLink.delete({ where: { id: linkId } });
}

/** Adds one more 文献メモ link — a PermanentNote can carry several (unlike
 * QuickNote, which stays single). Picking a memo already linked is a no-op
 * (unique constraint on the join table). */
export async function addLiteratureMemo(
  ownerSub: string,
  id: string,
  selection: LiteratureSelection,
): Promise<PermanentNoteDetail> {
  await requireOwnedPermanentNote(ownerSub, id);

  const literatureMemoId = await literatureMemos.resolveSelection(prisma, ownerSub, selection);
  if (literatureMemoId) {
    await prisma.permanentNoteLiteratureMemo.upsert({
      where: { permanentNoteId_literatureMemoId: { permanentNoteId: id, literatureMemoId } },
      create: { permanentNoteId: id, literatureMemoId },
      update: {},
    });
  }

  return toDetail(await requireOwnedPermanentNote(ownerSub, id));
}

export async function removeLiteratureMemo(
  ownerSub: string,
  id: string,
  literatureMemoId: string,
): Promise<PermanentNoteDetail> {
  await requireOwnedPermanentNote(ownerSub, id);
  await prisma.permanentNoteLiteratureMemo.deleteMany({
    where: { permanentNoteId: id, literatureMemoId },
  });
  return toDetail(await requireOwnedPermanentNote(ownerSub, id));
}

export interface PermanentNoteSearchResult {
  id: string;
  title: string;
}

/** Full-text-ish search across a permanent note's title and block contents, scoped to the owner. */
export async function search(ownerSub: string, query: string, limit = 20): Promise<PermanentNoteSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  return prisma.$queryRaw<PermanentNoteSearchResult[]>`
    SELECT pn.id, pn.title
    FROM permanent_note pn
    WHERE pn.owner_sub = ${ownerSub}
      AND (
        pn.title % ${q}
        OR pn.title ILIKE ${"%" + q + "%"}
        OR EXISTS (
          SELECT 1 FROM permanent_note_block pb
          WHERE pb.permanent_note_id = pn.id AND (pb.content % ${q} OR pb.content ILIKE ${"%" + q + "%"})
        )
      )
    ORDER BY GREATEST(
      similarity(pn.title, ${q}),
      CASE WHEN pn.title ILIKE ${q + "%"} THEN 0.9 ELSE 0 END
    ) DESC
    LIMIT ${limit}
  `;
}
