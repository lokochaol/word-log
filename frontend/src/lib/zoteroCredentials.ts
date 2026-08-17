import { prisma } from "@/lib/db";
import { decryptSecret, encryptSecret, isEncryptionConfigured } from "@/lib/crypto";

export interface ZoteroCredential {
  apiKey: string;
  libraryId: string;
  libraryType: string;
}

export interface ZoteroCredentialSummary {
  libraryId: string;
  libraryType: string;
  updatedAt: Date;
}

/** Decrypted credential for making a live Zotero API call. Returns null when
 * the owner hasn't linked a Zotero library — callers treat that as
 * "unconfigured", never as an error. */
export async function get(ownerSub: string): Promise<ZoteroCredential | null> {
  const row = await prisma.zoteroCredential.findUnique({ where: { ownerSub } });
  if (!row) return null;
  return {
    apiKey: decryptSecret(row.apiKeyEncrypted),
    libraryId: row.libraryId,
    libraryType: row.libraryType,
  };
}

/** For the settings screen — never returns the decrypted key itself. */
export async function getSummary(ownerSub: string): Promise<ZoteroCredentialSummary | null> {
  const row = await prisma.zoteroCredential.findUnique({ where: { ownerSub } });
  if (!row) return null;
  return { libraryId: row.libraryId, libraryType: row.libraryType, updatedAt: row.updatedAt };
}

export async function upsert(
  ownerSub: string,
  input: { apiKey: string; libraryId: string; libraryType: string },
): Promise<void> {
  const apiKeyEncrypted = encryptSecret(input.apiKey);
  await prisma.zoteroCredential.upsert({
    where: { ownerSub },
    create: { ownerSub, apiKeyEncrypted, libraryId: input.libraryId, libraryType: input.libraryType },
    update: { apiKeyEncrypted, libraryId: input.libraryId, libraryType: input.libraryType },
  });
}

export async function remove(ownerSub: string): Promise<void> {
  await prisma.zoteroCredential.deleteMany({ where: { ownerSub } });
}

export { isEncryptionConfigured };
