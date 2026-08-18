import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError } from "@/lib/errors";

/**
 * What the UI can submit when editing a note's 文献メモ link. A discriminated
 * union so every call site (QuickNote, PermanentNote, promotion drafts) goes
 * through the exact same shapes:
 *  - "existing": reuse an already-created LiteratureMemo by id (picked from
 *    the "既存の文献メモから選ぶ" list, or from Zotero search when that
 *    Zotero item was already linked once before — resolved via zotero dedup
 *    below, not via this variant).
 *  - "zotero": a Zotero search result (or a just-created Zotero item) —
 *    deduped server-side by (ownerSub, zoteroKey).
 *  - "manual": a hand-typed citation with no Zotero item behind it — never
 *    deduped, always creates a new row.
 *  - "none": clear the note's literature link.
 */
export type LiteratureSelection =
  | { type: "existing"; id: string; citation?: string } // citation is display-only, ignored by resolveSelection
  | { type: "zotero"; zoteroKey: string; citation: string; url: string | null; summary?: string | null }
  | { type: "manual"; citation: string; url: string | null; summary?: string | null }
  | { type: "none" };

/** A draft never holds the "none" selection variant — clearing one just drops it from the list. */
export type DraftLiteratureSelection = Exclude<LiteratureSelection, { type: "none" }>;

/** Structurally compatible with both the default `prisma` client and a
 * `Prisma.TransactionClient` from inside promotion.ts's transaction — see
 * promotion.ts's `resolveDuplicateOrderKeys` for the same pattern. */
type Db = Prisma.TransactionClient;

/** Lightweight embed of a LiteratureMemo on a QuickNote/PermanentNote detail — no backlink lists. */
export interface LiteratureMemoRef {
  id: string;
  zoteroKey: string | null;
  citation: string;
  url: string | null;
  summary: string | null;
}

export interface LiteratureMemoSummary {
  id: string;
  zoteroKey: string | null;
  citation: string;
  url: string | null;
  summary: string | null;
  quickNoteCount: number;
  permanentNoteCount: number;
  updatedAt: Date;
}

export interface LiteratureMemoBacklinkNote {
  id: string;
  title: string;
}

export interface LiteratureMemoBacklinkQuickNote {
  id: string;
  preview: string;
}

export interface LiteratureMemoDetail {
  id: string;
  zoteroKey: string | null;
  citation: string;
  url: string | null;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
  quickNotes: LiteratureMemoBacklinkQuickNote[];
  permanentNotes: LiteratureMemoBacklinkNote[];
}

/**
 * Core dedup logic — given a selection, returns the LiteratureMemo id to
 * attach to a note (or null to clear the link). For a Zotero-linked
 * selection this reuses an existing memo for the same (ownerSub, zoteroKey)
 * pair when one exists, refreshing its citation/url to whatever the caller
 * just supplied (Zotero is the source of truth for those two fields — the
 * owner's hand-written `summary` is never touched here). Manual entries have
 * no dedup key and always create a fresh row.
 */
export async function resolveSelection(
  db: Db,
  ownerSub: string,
  selection: LiteratureSelection | null | undefined,
): Promise<string | null> {
  if (!selection || selection.type === "none") return null;

  if (selection.type === "existing") {
    const memo = await db.literatureMemo.findFirst({ where: { id: selection.id, ownerSub } });
    if (!memo) throw new NotFoundError(`LiteratureMemo not found: ${selection.id}`);
    return memo.id;
  }

  if (selection.type === "zotero") {
    const existing = await db.literatureMemo.findFirst({
      where: { ownerSub, zoteroKey: selection.zoteroKey },
    });
    if (existing) {
      if (existing.citation !== selection.citation || existing.url !== (selection.url || null)) {
        await db.literatureMemo.update({
          where: { id: existing.id },
          data: { citation: selection.citation, url: selection.url || null },
        });
      }
      return existing.id;
    }
    const created = await db.literatureMemo.create({
      data: {
        ownerSub,
        zoteroKey: selection.zoteroKey,
        citation: selection.citation,
        url: selection.url || null,
        summary: selection.summary?.trim() || null,
      },
    });
    return created.id;
  }

  // manual — never deduped, always a fresh row.
  const created = await db.literatureMemo.create({
    data: {
      ownerSub,
      zoteroKey: null,
      citation: selection.citation,
      url: selection.url || null,
      summary: selection.summary?.trim() || null,
    },
  });
  return created.id;
}

/** PermanentNote-only: resolves a list of selections (e.g. carried over from
 * several merged 走り書き, each with their own literature link) into a
 * deduped list of LiteratureMemo ids — picking the same Zotero item twice,
 * or the same "existing" memo twice, collapses to one entry. */
export async function resolveSelections(
  db: Db,
  ownerSub: string,
  selections: LiteratureSelection[] | null | undefined,
): Promise<string[]> {
  if (!selections || selections.length === 0) return [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const selection of selections) {
    const id = await resolveSelection(db, ownerSub, selection);
    if (id && !seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

export async function requireOwnedLiteratureMemo(ownerSub: string, id: string) {
  const memo = await prisma.literatureMemo.findFirst({ where: { id, ownerSub } });
  if (!memo) throw new NotFoundError(`LiteratureMemo not found: ${id}`);
  return memo;
}

export async function list(ownerSub: string): Promise<LiteratureMemoSummary[]> {
  const memos = await prisma.literatureMemo.findMany({
    where: { ownerSub },
    // Ascending by creation — new memos append at the bottom, same reading
    // order as 走り書き's timeline (encounteredAt asc), rather than jumping
    // around whenever a summary edit bumps updatedAt.
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { quickNotes: true, permanentNoteLinks: true } } },
  });
  return memos.map((m) => ({
    id: m.id,
    zoteroKey: m.zoteroKey,
    citation: m.citation,
    url: m.url,
    summary: m.summary,
    quickNoteCount: m._count.quickNotes,
    permanentNoteCount: m._count.permanentNoteLinks,
    updatedAt: m.updatedAt,
  }));
}

/** Owner-scoped substring search over citation text, for the "既存の文献メモから選ぶ" picker. */
export async function search(ownerSub: string, query: string, limit = 20): Promise<LiteratureMemoSummary[]> {
  const q = query.trim();
  if (!q) return [];
  const memos = await prisma.literatureMemo.findMany({
    where: { ownerSub, citation: { contains: q, mode: "insensitive" } },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: { _count: { select: { quickNotes: true, permanentNoteLinks: true } } },
  });
  return memos.map((m) => ({
    id: m.id,
    zoteroKey: m.zoteroKey,
    citation: m.citation,
    url: m.url,
    summary: m.summary,
    quickNoteCount: m._count.quickNotes,
    permanentNoteCount: m._count.permanentNoteLinks,
    updatedAt: m.updatedAt,
  }));
}

export async function getDetail(ownerSub: string, id: string): Promise<LiteratureMemoDetail> {
  const memo = await prisma.literatureMemo.findFirst({
    where: { id, ownerSub },
    include: {
      quickNotes: {
        include: { blocks: { orderBy: { position: "asc" }, take: 1 } },
        orderBy: { encounteredAt: "desc" },
      },
      permanentNoteLinks: {
        include: { permanentNote: { select: { id: true, title: true, orderKey: true } } },
      },
    },
  });
  if (!memo) throw new NotFoundError(`LiteratureMemo not found: ${id}`);
  const permanentNotes = memo.permanentNoteLinks
    .map((l) => l.permanentNote)
    .sort((a, b) => a.orderKey.localeCompare(b.orderKey));
  return {
    id: memo.id,
    zoteroKey: memo.zoteroKey,
    citation: memo.citation,
    url: memo.url,
    summary: memo.summary,
    createdAt: memo.createdAt,
    updatedAt: memo.updatedAt,
    quickNotes: memo.quickNotes.map((n) => ({
      id: n.id,
      preview: n.blocks[0]?.content.slice(0, 120) ?? "",
    })),
    permanentNotes: permanentNotes.map((n) => ({ id: n.id, title: n.title })),
  };
}

export async function updateSummary(ownerSub: string, id: string, summary: string | null): Promise<LiteratureMemoDetail> {
  await requireOwnedLiteratureMemo(ownerSub, id);
  await prisma.literatureMemo.update({ where: { id }, data: { summary: summary?.trim() || null } });
  return getDetail(ownerSub, id);
}

/** Full-detail edit (citation/url/summary together) — used on the detail
 * page so a standalone memo created blank via `create` below can be filled
 * in afterward, the same "create empty shell, then edit" flow as QuickNote. */
export async function updateDetails(
  ownerSub: string,
  id: string,
  input: { citation: string; url: string | null; summary: string | null },
): Promise<LiteratureMemoDetail> {
  await requireOwnedLiteratureMemo(ownerSub, id);
  await prisma.literatureMemo.update({
    where: { id },
    data: {
      citation: input.citation.trim() || "(無題)",
      url: input.url?.trim() || null,
      summary: input.summary?.trim() || null,
    },
  });
  return getDetail(ownerSub, id);
}

/** Creates a standalone, blank LiteratureMemo not yet linked to any note —
 * the "＋文献メモ" quick-add flow, mirroring quickNotes.create's
 * create-empty-shell-then-navigate-to-edit pattern. Never deduped (same rule
 * as any other manual/no-zotero-key entry). */
export async function create(ownerSub: string): Promise<LiteratureMemoDetail> {
  const created = await prisma.literatureMemo.create({
    data: { ownerSub, zoteroKey: null, citation: "(無題)", url: null, summary: null },
  });
  return getDetail(ownerSub, created.id);
}

/** Deletes the memo. QuickNote's `onDelete: SetNull` cleanly unlinks it there;
 * PermanentNote's join rows `onDelete: Cascade` away (the permanent notes
 * themselves are untouched — only their link to this memo disappears). */
export async function remove(ownerSub: string, id: string): Promise<void> {
  await requireOwnedLiteratureMemo(ownerSub, id);
  await prisma.literatureMemo.delete({ where: { id } });
}
