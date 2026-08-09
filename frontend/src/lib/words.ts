import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export class ConflictError extends Error {}
export class NotFoundError extends Error {}

export type MeaningBlockType = "TEXT" | "CODE" | "MERMAID" | "IMAGE";

export interface MeaningBlockInput {
  type: MeaningBlockType;
  content: string;
  language?: string | null;
  caption?: string | null;
}

export interface MeaningBlock {
  id: string;
  type: MeaningBlockType;
  content: string;
  language: string | null;
  caption: string | null;
}

export interface RelatedWord {
  relationId: string;
  text: string;
  wordId: string | null;
}

export interface WordSummary {
  id: string;
  text: string;
  encounteredAt: Date;
}

export interface WordDetail {
  id: string;
  text: string;
  meaning: string | null;
  meaningBlocks: MeaningBlock[];
  encounteredAt: Date;
  updatedAt: Date;
  relatedWords: RelatedWord[];
}

export interface SearchResult {
  id: string;
  text: string;
  meaning: string | null;
}

export interface RelatedSuggestion {
  wordId: string;
  text: string;
  reason: "FUZZY_MATCH" | "REVERSE_RELATION";
  score: number | null;
}

const wordWithRelationsInclude = {
  relations: { orderBy: { createdAt: "asc" } },
  meaningBlocks: { orderBy: { position: "asc" } },
} satisfies Prisma.WordInclude;

type WordWithRelations = Prisma.WordGetPayload<{ include: typeof wordWithRelationsInclude }>;

async function toDetail(ownerSub: string, word: WordWithRelations): Promise<WordDetail> {
  const relatedTexts = word.relations.map((r) => r.relatedText);
  const matches =
    relatedTexts.length === 0
      ? []
      : await prisma.word.findMany({
          where: {
            ownerSub,
            text: { in: relatedTexts, mode: "insensitive" },
          },
          select: { id: true, text: true },
        });
  const idByLowerText = new Map(matches.map((m) => [m.text.toLowerCase(), m.id]));

  return {
    id: word.id,
    text: word.text,
    meaning: word.meaning,
    meaningBlocks: word.meaningBlocks.map((b) => ({
      id: b.id,
      type: b.type,
      content: b.content,
      language: b.language,
      caption: b.caption,
    })),
    encounteredAt: word.encounteredAt,
    updatedAt: word.updatedAt,
    relatedWords: word.relations.map((r) => ({
      relationId: r.id,
      text: r.relatedText,
      wordId: idByLowerText.get(r.relatedText.toLowerCase()) ?? null,
    })),
  };
}

async function requireOwnedWord(ownerSub: string, id: string): Promise<WordWithRelations> {
  const word = await prisma.word.findFirst({
    where: { id, ownerSub },
    include: wordWithRelationsInclude,
  });
  if (!word) throw new NotFoundError(`Word not found: ${id}`);
  return word;
}

export async function listChronological(ownerSub: string): Promise<WordSummary[]> {
  const words = await prisma.word.findMany({
    where: { ownerSub },
    orderBy: [{ encounteredAt: "asc" }, { createdAt: "asc" }],
    select: { id: true, text: true, encounteredAt: true },
  });
  return words;
}

export async function getDetail(ownerSub: string, id: string): Promise<WordDetail> {
  const word = await requireOwnedWord(ownerSub, id);
  return toDetail(ownerSub, word);
}

export async function create(ownerSub: string, text: string): Promise<WordDetail> {
  const trimmed = text.trim();
  const existing = await prisma.word.findFirst({
    where: { ownerSub, text: { equals: trimmed, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) {
    throw new ConflictError(`"${trimmed}" is already registered in your dictionary`);
  }
  const word = await prisma.word.create({
    data: { ownerSub, text: trimmed },
    include: wordWithRelationsInclude,
  });
  return toDetail(ownerSub, word);
}

export async function replaceMeaningBlocks(
  ownerSub: string,
  id: string,
  blocks: MeaningBlockInput[],
): Promise<WordDetail> {
  await requireOwnedWord(ownerSub, id);

  const derivedMeaning =
    blocks
      .filter((b) => b.type === "TEXT")
      .map((b) => b.content)
      .join("\n\n") || null;

  await prisma.$transaction([
    prisma.wordMeaningBlock.deleteMany({ where: { wordId: id } }),
    prisma.word.update({
      where: { id },
      data: {
        meaning: derivedMeaning,
        meaningBlocks: {
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

  const word = await requireOwnedWord(ownerSub, id);
  return toDetail(ownerSub, word);
}

export async function addRelatedWord(ownerSub: string, id: string, text: string): Promise<WordDetail> {
  const word = await requireOwnedWord(ownerSub, id);
  const relatedText = text.trim();

  const alreadyRelated = word.relations.some((r) => r.relatedText.toLowerCase() === relatedText.toLowerCase());
  if (alreadyRelated) {
    throw new ConflictError(`"${relatedText}" is already linked as a related word`);
  }

  await prisma.$transaction([
    prisma.wordRelation.create({ data: { wordId: id, relatedText } }),
    prisma.word.update({ where: { id }, data: { updatedAt: new Date() } }),
  ]);

  return toDetail(ownerSub, await requireOwnedWord(ownerSub, id));
}

export async function removeRelatedWord(ownerSub: string, id: string, relationId: string): Promise<void> {
  const word = await requireOwnedWord(ownerSub, id);
  const relation = word.relations.find((r) => r.id === relationId);
  if (!relation) throw new NotFoundError("Related word not found");

  await prisma.$transaction([
    prisma.wordRelation.delete({ where: { id: relationId } }),
    prisma.word.update({ where: { id }, data: { updatedAt: new Date() } }),
  ]);
}

/** Full-text-ish search across a word's text, meaning, and related words, scoped to the owner. */
export async function search(ownerSub: string, query: string, limit = 20): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  return prisma.$queryRaw<SearchResult[]>`
    SELECT w.id, w.text, w.meaning,
      GREATEST(
        similarity(w.text, ${q}),
        CASE WHEN w.text ILIKE ${q + "%"} THEN 0.9 ELSE 0 END,
        COALESCE(similarity(w.meaning, ${q}), 0) * 0.6,
        COALESCE((SELECT MAX(similarity(wr.related_text, ${q})) FROM word_relation wr WHERE wr.word_id = w.id), 0) * 0.6
      ) AS rank
    FROM word w
    WHERE w.owner_sub = ${ownerSub}
      AND (
        w.text % ${q}
        OR w.text ILIKE ${"%" + q + "%"}
        OR w.meaning % ${q}
        OR EXISTS (SELECT 1 FROM word_relation wr WHERE wr.word_id = w.id AND wr.related_text % ${q})
      )
    ORDER BY rank DESC
    LIMIT ${limit}
  `;
}

/**
 * Suggests related-word candidates for `id`: other words in the same dictionary whose
 * text is a close spelling match (trigram similarity), plus words that already list
 * `id` as their own related word but aren't linked back yet. Excludes words already
 * related and the word itself.
 */
export async function suggestRelatedWords(ownerSub: string, id: string, limit = 8): Promise<RelatedSuggestion[]> {
  const word = await requireOwnedWord(ownerSub, id);

  const excludedLowerText = new Set(word.relations.map((r) => r.relatedText.toLowerCase()));
  excludedLowerText.add(word.text.toLowerCase());

  const fuzzyRows = await prisma.$queryRaw<{ id: string; text: string; score: number }[]>`
    SELECT id, text, similarity(text, ${word.text}) AS score
    FROM word
    WHERE owner_sub = ${ownerSub} AND id != ${id} AND text % ${word.text}
    ORDER BY score DESC
    LIMIT ${limit}
  `;

  const suggestions = new Map<string, RelatedSuggestion>();
  for (const row of fuzzyRows) {
    if (excludedLowerText.has(row.text.toLowerCase())) continue;
    suggestions.set(row.id, { wordId: row.id, text: row.text, reason: "FUZZY_MATCH", score: row.score });
  }

  const reverseRelations = await prisma.wordRelation.findMany({
    where: {
      relatedText: { equals: word.text, mode: "insensitive" },
      word: { ownerSub, id: { not: id } },
    },
    include: { word: { select: { id: true, text: true } } },
  });
  for (const rel of reverseRelations) {
    if (excludedLowerText.has(rel.word.text.toLowerCase())) continue;
    if (!suggestions.has(rel.word.id)) {
      suggestions.set(rel.word.id, {
        wordId: rel.word.id,
        text: rel.word.text,
        reason: "REVERSE_RELATION",
        score: null,
      });
    }
  }

  return Array.from(suggestions.values()).slice(0, limit);
}
