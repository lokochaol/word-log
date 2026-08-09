"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import * as words from "@/lib/words";
import type { MeaningBlockInput, RelatedSuggestion, SearchResult } from "@/lib/words";
import { requireOwnerSub } from "@/lib/session";
import { signIn, signOut } from "@/auth";

export async function googleSignIn() {
  await signIn("google", { redirectTo: "/" });
}

export async function googleSignOut() {
  await signOut({ redirectTo: "/signin" });
}

export async function createWordAction(formData: FormData) {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { error: "単語を入力してください" };
  const ownerSub = await requireOwnerSub();
  try {
    const word = await words.create(ownerSub, text);
    revalidatePath("/");
    redirect(`/words/${word.id}`);
  } catch (e) {
    if (e instanceof words.ConflictError) return { error: e.message };
    throw e;
  }
}

export async function replaceMeaningBlocksAction(id: string, blocks: MeaningBlockInput[]) {
  const ownerSub = await requireOwnerSub();
  await words.replaceMeaningBlocks(ownerSub, id, blocks);
  revalidatePath(`/words/${id}`);
  revalidatePath("/");
}

export async function addRelatedWordAction(id: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const ownerSub = await requireOwnerSub();
  await words.addRelatedWord(ownerSub, id, trimmed);
  revalidatePath(`/words/${id}`);
}

export async function removeRelatedWordAction(id: string, relationId: string) {
  const ownerSub = await requireOwnerSub();
  await words.removeRelatedWord(ownerSub, id, relationId);
  revalidatePath(`/words/${id}`);
}

export async function searchWordsAction(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  const ownerSub = await requireOwnerSub();
  return words.search(ownerSub, q);
}

export async function findExactMatch(text: string): Promise<SearchResult | null> {
  const q = text.trim();
  if (!q) return null;
  const ownerSub = await requireOwnerSub();
  const results = await words.search(ownerSub, q, 5);
  return results.find((r) => r.text.localeCompare(q, undefined, { sensitivity: "base" }) === 0) ?? null;
}

export async function suggestRelatedWordsAction(id: string): Promise<RelatedSuggestion[]> {
  const ownerSub = await requireOwnerSub();
  return words.suggestRelatedWords(ownerSub, id);
}
