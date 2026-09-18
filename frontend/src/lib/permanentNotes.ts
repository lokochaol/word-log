import { prisma } from "@/lib/db";
import { Prisma, LinkTargetType } from "@/generated/prisma/client";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { midpointRank } from "@/lib/rank";
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
  content: string;
  outboundLinks: LinkView[];
  inboundLinks: LinkView[];
  indexEntries: IndexEntryRefView[];
  literatureMemos: LiteratureMemoRef[];
  createdAt: Date;
  updatedAt: Date;
}

const detailInclude = {
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
    content: note.content,
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

/**
 * A permanent note's title and body stay editable after it's filed. The
 * method's "write it in your own words" step isn't a one-shot — rereading a
 * note later and sharpening the wording is the same act as writing it. What
 * stays fixed is the note's place in the order: that was chosen in relation
 * to its neighbors, and moving it is a different decision from rewording it.
 */
export async function updateTitleAndContent(
  ownerSub: string,
  id: string,
  title: string,
  content: string,
): Promise<PermanentNoteDetail> {
  await requireOwnedPermanentNote(ownerSub, id);
  const trimmedTitle = title.trim();
  if (!trimmedTitle) throw new ValidationError("permanentNoteTitleRequired", "Title is required");
  if (!content.trim()) throw new ValidationError("permanentNoteContentRequired", "Content is required");
  const updated = await prisma.permanentNote.update({
    where: { id },
    data: { title: trimmedTitle, content },
    include: detailInclude,
  });
  return toDetail(updated);
}

export interface DeletionImpact {
  /** Links *from other notes* pointing at this one. Deleting cascades them
   * away, so this is other notes losing a link they wrote. */
  inboundLinkCount: number;
  /** Index keywords pointing at this note; they cascade away with it, which
   * would silently remove an entry point into the whole order. */
  indexKeywords: string[];
}

/** What would be lost along with this note — the delete confirmation needs
 * to say it out loud, because the cascades reach records the owner made
 * elsewhere, not just this note's own rows. */
export async function deletionImpact(ownerSub: string, id: string): Promise<DeletionImpact> {
  await requireOwnedPermanentNote(ownerSub, id);
  const [inboundLinkCount, indexEntries] = await Promise.all([
    prisma.permanentNoteLink.count({ where: { targetNoteId: id } }),
    prisma.indexEntry.findMany({ where: { noteId: id, ownerSub }, select: { keyword: true } }),
  ]);
  return { inboundLinkCount, indexKeywords: indexEntries.map((e) => e.keyword) };
}

/** Deletes the note. Its own outbound links, other notes' links *to* it, its
 * index entries and its literature-memo joins all cascade (see
 * prisma/schema.prisma); the literature memos themselves are shared and
 * stay. The promotion batch that produced it loses its output row, so a
 * batch can end up recording sources with nothing to show for them — that's
 * accurate history, not a gap. */
export async function remove(ownerSub: string, id: string): Promise<void> {
  await requireOwnedPermanentNote(ownerSub, id);
  await prisma.permanentNote.delete({ where: { id } });
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

/** Full-text-ish search across a permanent note's title and content, scoped to the owner. */
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
        OR pn.content % ${q}
        OR pn.content ILIKE ${"%" + q + "%"}
      )
    ORDER BY GREATEST(
      similarity(pn.title, ${q}),
      CASE WHEN pn.title ILIKE ${q + "%"} THEN 0.9 ELSE 0 END
    ) DESC
    LIMIT ${limit}
  `;
}
