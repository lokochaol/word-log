/** Shared domain error types for the lib layer — mirrors the pattern that
 * originally lived in src/lib/words.ts, now shared across quickNotes,
 * permanentNotes, indexEntries, promotion, and zotero. */

export class ConflictError extends Error {}
export class NotFoundError extends Error {}
export class ValidationError extends Error {}
