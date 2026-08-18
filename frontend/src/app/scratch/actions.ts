"use server";

import { revalidatePath } from "next/cache";
import * as quickNotes from "@/lib/quickNotes";
import type { BlockInput, QuickNoteDetail } from "@/lib/quickNotes";
import * as zotero from "@/lib/zotero";
import type { ZoteroSearchResult } from "@/lib/zotero";
import * as zoteroCredentials from "@/lib/zoteroCredentials";
import * as literatureMemos from "@/lib/literatureMemos";
import type { LiteratureMemoSummary, LiteratureSelection } from "@/lib/literatureMemos";
import { requireOwnerSub } from "@/lib/session";
import { QuickNoteSource } from "@/generated/prisma/client";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { translateZoteroError } from "@/lib/i18n/errors";

export async function createQuickNoteAction(source: QuickNoteSource = "SCRATCH"): Promise<QuickNoteDetail> {
  const ownerSub = await requireOwnerSub();
  const note = await quickNotes.create(ownerSub, source);
  revalidatePath("/scratch");
  return note;
}

export async function replaceQuickNoteBlocksAction(id: string, blocks: BlockInput[]): Promise<QuickNoteDetail> {
  const ownerSub = await requireOwnerSub();
  const note = await quickNotes.replaceBlocks(ownerSub, id, blocks);
  revalidatePath(`/scratch/${id}`);
  revalidatePath("/scratch");
  revalidatePath("/zettelkasten");
  return note;
}

export async function deleteQuickNoteAction(id: string): Promise<void> {
  const ownerSub = await requireOwnerSub();
  await quickNotes.remove(ownerSub, id);
  revalidatePath("/scratch");
  revalidatePath("/zettelkasten");
}

export async function setLiteratureMemoAction(id: string, selection: LiteratureSelection): Promise<QuickNoteDetail> {
  const ownerSub = await requireOwnerSub();
  const note = await quickNotes.setLiteratureMemo(ownerSub, id, selection);
  revalidatePath(`/scratch/${id}`);
  revalidatePath("/scratch");
  return note;
}

/** Owner's existing literature memos, matched by citation substring — backs the
 * "既存の文献メモから選ぶ" reuse picker so a memo created once doesn't need a
 * fresh Zotero search to be reused on another note. */
export async function searchLiteratureMemosAction(query: string): Promise<LiteratureMemoSummary[]> {
  const ownerSub = await requireOwnerSub();
  return literatureMemos.search(ownerSub, query);
}

export type ZoteroSearchResponse =
  | { status: "ok"; results: ZoteroSearchResult[] }
  | { status: "unconfigured" }
  | { status: "error"; message: string };

export async function zoteroSearchAction(query: string): Promise<ZoteroSearchResponse> {
  const ownerSub = await requireOwnerSub();
  const locale = await getLocale();
  try {
    const credential = await zoteroCredentials.get(ownerSub);
    if (!credential) {
      return { status: "unconfigured" };
    }
    const results = await zotero.searchItems(credential, query, 10, getDictionary(locale).literaturePicker.untitled);
    return { status: "ok", results };
  } catch (e) {
    if (e instanceof zotero.ZoteroApiError) {
      return { status: "error", message: translateZoteroError(locale, e) };
    }
    // Anything else (e.g. decryption failing because CREDENTIAL_ENCRYPTION_KEY
    // was rotated after the credential was saved) must still resolve to a
    // visible state — never let this reject and leave the UI stuck "searching".
    return {
      status: "error",
      message: getDictionary(locale).errors.zoteroLoadFailed,
    };
  }
}

export type ZoteroCreateResponse =
  | { status: "ok"; result: ZoteroSearchResult }
  | { status: "unconfigured" }
  | { status: "error"; message: string };

export async function zoteroCreateItemAction(
  input: zotero.CreateItemInput,
): Promise<ZoteroCreateResponse> {
  const ownerSub = await requireOwnerSub();
  const locale = await getLocale();
  try {
    const credential = await zoteroCredentials.get(ownerSub);
    if (!credential) {
      return { status: "unconfigured" };
    }
    const result = await zotero.createItem(credential, input);
    return { status: "ok", result };
  } catch (e) {
    if (e instanceof zotero.ZoteroApiError) {
      return { status: "error", message: translateZoteroError(locale, e) };
    }
    return {
      status: "error",
      message: getDictionary(locale).errors.zoteroLoadFailed,
    };
  }
}

export async function searchQuickNotesAction(query: string) {
  const ownerSub = await requireOwnerSub();
  return quickNotes.search(ownerSub, query);
}

export async function listActiveQuickNotesAction() {
  const ownerSub = await requireOwnerSub();
  return quickNotes.listActive(ownerSub);
}

export async function getQuickNoteDetailAction(id: string): Promise<QuickNoteDetail> {
  const ownerSub = await requireOwnerSub();
  return quickNotes.getDetail(ownerSub, id);
}
