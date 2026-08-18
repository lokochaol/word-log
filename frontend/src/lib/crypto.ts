import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

/**
 * AES-256-GCM helpers for storing per-user third-party API keys (Zotero,
 * etc.) at rest. The app-wide secret CREDENTIAL_ENCRYPTION_KEY only protects
 * the *storage*; it never crosses user boundaries — each row is encrypted
 * independently with its own random IV, so this key being shared across all
 * users' rows is not a multi-tenancy leak, just an infra secret like any
 * other (session secret, DB password, etc).
 */

/** `code` is always "encryptionNotConfigured" — kept as a field (rather than
 * a bare Error) purely for parity with DomainError so callers can translate
 * it the same way (see translateDomainError's default branch / settings
 * actions.ts, which maps this one code by hand since it lives outside the
 * ConflictError/NotFoundError/ValidationError hierarchy). */
export class EncryptionConfigError extends Error {
  code = "encryptionNotConfigured" as const;
}

function getKey(): Buffer {
  const secret = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!secret) {
    throw new EncryptionConfigError("CREDENTIAL_ENCRYPTION_KEY is not set. Credentials cannot be encrypted.");
  }
  // Accept any passphrase length/format — derive a fixed 32-byte AES-256 key.
  return createHash("sha256").update(secret).digest();
}

const IV_LENGTH = 12; // GCM standard nonce length

export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

export function decryptSecret(payload: string): string {
  const key = getKey();
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + 16);
  const ciphertext = raw.subarray(IV_LENGTH + 16);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function isEncryptionConfigured(): boolean {
  return !!process.env.CREDENTIAL_ENCRYPTION_KEY;
}
