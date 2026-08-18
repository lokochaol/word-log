"use server";

import { revalidatePath } from "next/cache";
import * as zoteroCredentials from "@/lib/zoteroCredentials";
import type { ZoteroCredentialSummary } from "@/lib/zoteroCredentials";
import { EncryptionConfigError } from "@/lib/crypto";
import { requireOwnerSub } from "@/lib/session";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export async function getZoteroSettingsAction(): Promise<ZoteroCredentialSummary | null> {
  const ownerSub = await requireOwnerSub();
  return zoteroCredentials.getSummary(ownerSub);
}

export async function saveZoteroSettingsAction(input: {
  apiKey: string;
  libraryId: string;
  libraryType: string;
}): Promise<{ error: string } | { ok: true }> {
  const ownerSub = await requireOwnerSub();
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const apiKey = input.apiKey.trim();
  const libraryId = input.libraryId.trim();
  const libraryType = input.libraryType === "group" ? "group" : "user";

  if (!apiKey || !libraryId) {
    return { error: dict.settings.missingFieldsError };
  }

  try {
    await zoteroCredentials.upsert(ownerSub, { apiKey, libraryId, libraryType });
  } catch (e) {
    if (e instanceof EncryptionConfigError) {
      return { error: dict.errors.encryptionNotConfigured };
    }
    throw e;
  }

  revalidatePath("/settings");
  return { ok: true };
}

export async function removeZoteroSettingsAction(): Promise<void> {
  const ownerSub = await requireOwnerSub();
  await zoteroCredentials.remove(ownerSub);
  revalidatePath("/settings");
}
