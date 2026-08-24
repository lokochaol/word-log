import { prisma } from "@/lib/db";
import { AiProvider } from "@/generated/prisma/client";
import { decryptSecret, encryptSecret, isEncryptionConfigured } from "@/lib/crypto";

export { AiProvider };

export interface AiCredential {
  provider: AiProvider;
  apiKey: string;
}

export interface AiCredentialSummary {
  provider: AiProvider;
  updatedAt: Date;
}

/** Decrypted credential for calling the owner's chosen LLM provider (see
 * src/lib/discovery.ts). Returns null when the owner hasn't configured one —
 * callers treat that as "unconfigured", never as an error. */
export async function get(ownerSub: string): Promise<AiCredential | null> {
  const row = await prisma.aiCredential.findUnique({ where: { ownerSub } });
  if (!row) return null;
  return { provider: row.provider, apiKey: decryptSecret(row.apiKeyEncrypted) };
}

/** For the settings screen — never returns the decrypted key itself. */
export async function getSummary(ownerSub: string): Promise<AiCredentialSummary | null> {
  const row = await prisma.aiCredential.findUnique({ where: { ownerSub } });
  if (!row) return null;
  return { provider: row.provider, updatedAt: row.updatedAt };
}

export async function upsert(ownerSub: string, input: { provider: AiProvider; apiKey: string }): Promise<void> {
  const apiKeyEncrypted = encryptSecret(input.apiKey);
  await prisma.aiCredential.upsert({
    where: { ownerSub },
    create: { ownerSub, provider: input.provider, apiKeyEncrypted },
    update: { provider: input.provider, apiKeyEncrypted },
  });
}

export async function remove(ownerSub: string): Promise<void> {
  await prisma.aiCredential.deleteMany({ where: { ownerSub } });
}

export { isEncryptionConfigured };
