import { prisma } from "@/lib/db";
import { ConflictError, NotFoundError } from "@/lib/errors";

export interface IndexEntrySummary {
  id: string;
  keyword: string;
  noteId: string;
  noteTitle: string;
}

export async function list(ownerSub: string): Promise<IndexEntrySummary[]> {
  const entries = await prisma.indexEntry.findMany({
    where: { ownerSub },
    orderBy: { keyword: "asc" },
    include: { note: { select: { title: true } } },
  });
  return entries.map((e) => ({ id: e.id, keyword: e.keyword, noteId: e.noteId, noteTitle: e.note.title }));
}

export async function create(ownerSub: string, keyword: string, noteId: string): Promise<IndexEntrySummary> {
  const trimmed = keyword.trim();
  if (!trimmed) throw new ConflictError("キーワードを入力してください");

  const note = await prisma.permanentNote.findFirst({ where: { id: noteId, ownerSub }, select: { title: true } });
  if (!note) throw new NotFoundError(`PermanentNote not found: ${noteId}`);

  const existing = await prisma.indexEntry.findFirst({
    where: { ownerSub, keyword: { equals: trimmed, mode: "insensitive" } },
  });
  if (existing) {
    throw new ConflictError(`索引キーワード「${trimmed}」はすでに使われています`);
  }

  const entry = await prisma.indexEntry.create({
    data: { ownerSub, keyword: trimmed, noteId },
  });
  return { id: entry.id, keyword: entry.keyword, noteId, noteTitle: note.title };
}

export async function remove(ownerSub: string, id: string): Promise<void> {
  const entry = await prisma.indexEntry.findFirst({ where: { id, ownerSub } });
  if (!entry) throw new NotFoundError(`IndexEntry not found: ${id}`);
  await prisma.indexEntry.delete({ where: { id } });
}
