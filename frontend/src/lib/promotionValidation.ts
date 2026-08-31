import type { LiteratureSelection } from "@/lib/literatureMemos";
import { getDictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/types";

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
  content: string;
  links: DraftLink[];
  /** Resolved via computeInsertRankAction / insertRank before submission — null means "not yet chosen". */
  orderKey: string | null;
  /** Optional 文献メモ links (a PermanentNote can hold several — e.g. carried
   * over from multiple merged 走り書き, each with their own citation) —
   * resolved (dedup/create) inside the promotion transaction itself, since the
   * PermanentNote doesn't exist in the DB until that transaction commits.
   * Never required for a draft to be valid. */
  literatureSelections?: LiteratureSelection[];
}

export interface ValidateDraftOptions {
  /** True once the owner has at least one PermanentNote already — a link
   * target (another note or an index entry, both of which require an
   * existing note to exist first) is only possible then. The very first
   * PermanentNote ever has nothing to link to, so the requirement is waived
   * for it specifically. */
  hasExistingNotes: boolean;
  /** Which language to phrase the returned problem strings in — defaults to
   * "ja" so existing callers that don't pass a locale keep working. Pure
   * function (getDictionary has no DB import) so this file stays bundleable
   * for the browser, matching its original constraint. */
  locale?: Locale;
}

/**
 * Shared by the client (inline draft-gating in PromotionEditor) and the
 * server (re-validated before touching the DB, in completePromotion).
 * Returns a list of human-readable problems; empty means valid.
 */
export function validateDraft(draft: PermanentNoteDraft, opts: ValidateDraftOptions): string[] {
  const dict = getDictionary(opts.locale ?? "ja").validation;
  const problems: string[] = [];
  if (!draft.title.trim()) problems.push(dict.titleRequired);
  if (!draft.content.trim()) problems.push(dict.contentRequired);
  if (opts.hasExistingNotes && draft.links.length === 0) problems.push(dict.linkRequired);
  if (draft.links.some((l) => !l.relationLabel.trim())) problems.push(dict.linkRelationRequired);
  if (draft.orderKey === null) problems.push(dict.positionRequired);
  return problems;
}
