import type { BlockInput } from "@/lib/blocks";
import type { LiteratureSelection } from "@/lib/literatureMemos";

/**
 * Pure types + validator for the promotion draft, split out of
 * src/lib/promotion.ts specifically so it has NO import of @/lib/db (Prisma
 * + `pg`) — this file is imported directly by client components
 * (PromotionEditor) and must stay bundleable for the browser.
 */

export interface DraftLink {
  relationLabel: string;
  target: { type: "PERMANENT_NOTE"; noteId: string } | { type: "INDEX_ENTRY"; indexEntryId: string };
}

export interface PermanentNoteDraft {
  title: string;
  blocks: BlockInput[];
  links: DraftLink[];
  /** Resolved via computeInsertRankAction / insertRank before submission — null means "not yet chosen". */
  orderKey: string | null;
  /** Optional 文献メモ link — resolved (dedup/create) inside the promotion transaction itself, since the
   * PermanentNote doesn't exist in the DB until that transaction commits. Never required for a draft to be valid. */
  literature?: LiteratureSelection;
}

/**
 * Shared by the client (inline draft-gating in PromotionEditor) and the
 * server (re-validated before touching the DB, in completePromotion).
 * Returns a list of human-readable problems; empty means valid.
 */
export function validateDraft(draft: PermanentNoteDraft): string[] {
  const problems: string[] = [];
  if (!draft.title.trim()) problems.push("タイトルを入力してください");
  if (draft.blocks.filter((b) => b.content.trim()).length === 0) problems.push("内容を1件以上入力してください");
  if (draft.links.length === 0) problems.push("リンクを1件以上設定してください");
  if (draft.links.some((l) => !l.relationLabel.trim())) problems.push("すべてのリンクに関係性の一言を入力してください");
  if (draft.orderKey === null) problems.push("保存位置を選択してください");
  return problems;
}
