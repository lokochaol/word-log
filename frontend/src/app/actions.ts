"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api, ApiError, type SearchResult } from "@/lib/api";
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
  try {
    const word = await api.createWord(text);
    revalidatePath("/");
    redirect(`/words/${word.id}`);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
}

export async function updateMeaningAction(id: string, meaning: string) {
  await api.updateMeaning(id, meaning);
  revalidatePath(`/words/${id}`);
  revalidatePath("/");
}

export async function addRelatedWordAction(id: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  await api.addRelatedWord(id, trimmed);
  revalidatePath(`/words/${id}`);
}

export async function removeRelatedWordAction(id: string, relationId: string) {
  await api.removeRelatedWord(id, relationId);
  revalidatePath(`/words/${id}`);
}

export async function searchWordsAction(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  return api.search(q);
}

export async function findExactMatch(text: string): Promise<SearchResult | null> {
  const q = text.trim();
  if (!q) return null;
  const results = await api.search(q, 5);
  return results.find((r) => r.text.localeCompare(q, undefined, { sensitivity: "base" }) === 0) ?? null;
}
