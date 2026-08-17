"use server";

import { revalidatePath } from "next/cache";
import * as quickNotes from "@/lib/quickNotes";
import type { BlockInput, QuickNoteDetail } from "@/lib/quickNotes";
import * as zotero from "@/lib/zotero";
import type { ZoteroSearchResult } from "@/lib/zotero";
import * as zoteroCredentials from "@/lib/zoteroCredentials";
import { requireOwnerSub } from "@/lib/session";
import { QuickNoteSource } from "@/generated/prisma/client";

export async function createQuickNoteAction(source: QuickNoteSource = "SCRATCH"): Promise<QuickNoteDetail> {
  const ownerSub = await requireOwnerSub();
  const note = await quickNotes.create(ownerSub, source);
  revalidatePath("/scratch");
  return note;
}

export async function replaceQuickNoteBlocksAction(id: string, blocks: BlockInput[]) {
  const ownerSub = await requireOwnerSub();
  await quickNotes.replaceBlocks(ownerSub, id, blocks);
  revalidatePath(`/scratch/${id}`);
  revalidatePath("/scratch");
}

export async function setLiteratureMemoAction(
  id: string,
  literature: { citation: string | null; url: string | null; zoteroKey: string | null; summary: string | null },
) {
  const ownerSub = await requireOwnerSub();
  await quickNotes.setLiteratureMemo(ownerSub, id, literature);
  revalidatePath(`/scratch/${id}`);
  revalidatePath("/scratch");
}

export type ZoteroSearchResponse =
  | { status: "ok"; results: ZoteroSearchResult[] }
  | { status: "unconfigured" }
  | { status: "error"; message: string };

export async function zoteroSearchAction(query: string): Promise<ZoteroSearchResponse> {
  const ownerSub = await requireOwnerSub();
  const credential = await zoteroCredentials.get(ownerSub);
  if (!credential) {
    return { status: "unconfigured" };
  }
  try {
    const results = await zotero.searchItems(credential, query);
    return { status: "ok", results };
  } catch (e) {
    if (e instanceof zotero.ZoteroApiError) {
      return { status: "error", message: e.message };
    }
    throw e;
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
