import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { validateDraft, type PermanentNoteDraft } from "@/lib/promotionValidation";
import { midpointRank } from "@/lib/rank";
import * as literatureMemos from "@/lib/literatureMemos";

export type { DraftLink, PermanentNoteDraft } from "@/lib/promotionValidation";
export { validateDraft } from "@/lib/promotionValidation";

export interface CompletePromotionInput {
  quickNoteIds: string[];
  drafts: PermanentNoteDraft[];
}

export interface CompletePromotionResult {
  batchId: string;
  permanentNoteIds: string[];
}

export async function completePromotion(
  ownerSub: string,
  input: CompletePromotionInput,
): Promise<CompletePromotionResult> {
  if (input.quickNoteIds.length === 0) {
    throw new ValidationError("走り書きを1件以上選択してください");
  }
  if (input.drafts.length === 0) {
    throw new ValidationError("永久保存版メモを1件以上作成してください");
  }
  for (const draft of input.drafts) {
    const problems = validateDraft(draft);
    if (problems.length > 0) {
      throw new ValidationError(`永久保存版メモ「${draft.title || "(無題)"}」: ${problems.join(" / ")}`);
    }
  }
  try {
    return await runPromotionTransaction(ownerSub, input);
  } catch (e) {
    // Someone else (or another tab) inserted a permanent note at the exact
    // same order_key between when the position was picked and this commit.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ConflictError("選択した保存位置は他のメモに使われました。位置を選び直してください。");
    }
    throw e;
  }
}

/** Drafts sharing an identical requested orderKey (picked the same gap) keep
 * their submission order but must not collide — chain them into distinct
 * ranks between the shared key and the gap's real next neighbor. */
async function resolveDuplicateOrderKeys(
  tx: Prisma.TransactionClient,
  ownerSub: string,
  keys: string[],
): Promise<string[]> {
  const resolved = [...keys];
  const indicesByKey = new Map<string, number[]>();
  keys.forEach((key, i) => {
    const arr = indicesByKey.get(key) ?? [];
    arr.push(i);
    indicesByKey.set(key, arr);
  });

  for (const [key, indices] of indicesByKey) {
    if (indices.length <= 1) continue;
    const next = await tx.permanentNote.findFirst({
      where: { ownerSub, orderKey: { gt: key } },
      orderBy: { orderKey: "asc" },
      select: { orderKey: true },
    });
    const afterKey = next?.orderKey ?? null;
    let prev = key; // first item keeps the originally picked key
    for (let n = 1; n < indices.length; n++) {
      prev = midpointRank(prev, afterKey);
      resolved[indices[n]] = prev;
    }
  }
  return resolved;
}

async function runPromotionTransaction(
  ownerSub: string,
  input: CompletePromotionInput,
): Promise<CompletePromotionResult> {
  return prisma.$transaction(async (tx) => {
    // 1. Re-verify ownership + ACTIVE status of every source quick note.
    const sourceNotes = await tx.quickNote.findMany({
      where: { id: { in: input.quickNoteIds }, ownerSub },
      select: { id: true, status: true },
    });
    if (sourceNotes.length !== input.quickNoteIds.length) {
      throw new NotFoundError("選択された走り書きの一部が見つかりません");
    }
    if (sourceNotes.some((n) => n.status !== "ACTIVE")) {
      throw new ConflictError("選択された走り書きの一部はすでに昇格済みです");
    }

    // Re-verify ownership of every link target referenced by any draft.
    const noteTargetIds = new Set<string>();
    const indexEntryTargetIds = new Set<string>();
    for (const draft of input.drafts) {
      for (const link of draft.links) {
        if (link.target.type === "PERMANENT_NOTE") noteTargetIds.add(link.target.noteId);
        else indexEntryTargetIds.add(link.target.indexEntryId);
      }
    }
    if (noteTargetIds.size > 0) {
      const owned = await tx.permanentNote.findMany({
        where: { id: { in: [...noteTargetIds] }, ownerSub },
        select: { id: true },
      });
      if (owned.length !== noteTargetIds.size) {
        throw new NotFoundError("リンク先の永久保存版メモの一部が見つかりません");
      }
    }
    if (indexEntryTargetIds.size > 0) {
      const owned = await tx.indexEntry.findMany({
        where: { id: { in: [...indexEntryTargetIds] }, ownerSub },
        select: { id: true },
      });
      if (owned.length !== indexEntryTargetIds.size) {
        throw new NotFoundError("リンク先の索引エントリの一部が見つかりません");
      }
    }

    // 2. (Already re-validated above via validateDraft.)

    // 2b. Multiple drafts pointed at the exact same gap are allowed — they
    // land consecutively in the order they were entered, chained into
    // distinct ranks squeezed between the shared position and its real next
    // neighbor (queried fresh here so it reflects the committing transaction's view).
    const resolvedOrderKeys = await resolveDuplicateOrderKeys(
      tx,
      ownerSub,
      input.drafts.map((d) => d.orderKey as string),
    );

    // 3. Create each PermanentNote with its blocks and outbound links.
    const permanentNoteIds: string[] = [];
    for (let i = 0; i < input.drafts.length; i++) {
      const draft = input.drafts[i];
      const filteredBlocks = draft.blocks.filter((b) => b.content.trim());
      const literatureMemoIds = await literatureMemos.resolveSelections(tx, ownerSub, draft.literatureSelections);
      const created = await tx.permanentNote.create({
        data: {
          ownerSub,
          title: draft.title.trim(),
          orderKey: resolvedOrderKeys[i],
          literatureMemos: { create: literatureMemoIds.map((literatureMemoId) => ({ literatureMemoId })) },
          blocks: {
            create: filteredBlocks.map((b, i) => ({
              position: i,
              type: b.type,
              content: b.content,
              language: b.language || null,
              caption: b.caption || null,
            })),
          },
          outboundLinks: {
            create: draft.links.map((l) => ({
              relationLabel: l.relationLabel.trim(),
              targetType: l.target.type,
              targetNoteId: l.target.type === "PERMANENT_NOTE" ? l.target.noteId : null,
              targetIndexEntryId: l.target.type === "INDEX_ENTRY" ? l.target.indexEntryId : null,
            })),
          },
        },
        select: { id: true },
      });
      permanentNoteIds.push(created.id);
    }

    // 4. Archive the source quick notes.
    await tx.quickNote.updateMany({
      where: { id: { in: input.quickNoteIds }, ownerSub },
      data: { status: "ARCHIVED" },
    });

    // 5. Record the batch + join rows.
    const batch = await tx.promotionBatch.create({
      data: {
        ownerSub,
        sourceQuickNotes: { create: input.quickNoteIds.map((quickNoteId) => ({ quickNoteId })) },
        outputPermanentNotes: { create: permanentNoteIds.map((permanentNoteId) => ({ permanentNoteId })) },
      },
      select: { id: true },
    });

    return { batchId: batch.id, permanentNoteIds };
  });
}

export interface BatchHistoryEntry {
  id: string;
  createdAt: Date;
  sourceQuickNoteIds: string[];
  outputPermanentNoteIds: string[];
}

export async function listBatchHistory(ownerSub: string): Promise<BatchHistoryEntry[]> {
  const batches = await prisma.promotionBatch.findMany({
    where: { ownerSub },
    orderBy: { createdAt: "desc" },
    include: { sourceQuickNotes: true, outputPermanentNotes: true },
  });
  return batches.map((b) => ({
    id: b.id,
    createdAt: b.createdAt,
    sourceQuickNoteIds: b.sourceQuickNotes.map((s) => s.quickNoteId),
    outputPermanentNoteIds: b.outputPermanentNotes.map((o) => o.permanentNoteId),
  }));
}
