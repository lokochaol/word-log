/**
 * Shared TEXT/CODE/MERMAID/IMAGE block types — pulled out of quickNotes.ts
 * so client components (BlocksEditor, PromotionEditor) and the pure
 * promotion-draft validator can import the shape without dragging in
 * @/lib/db (Prisma + `pg`, which cannot be bundled into client code).
 */

export type BlockType = "TEXT" | "CODE" | "MERMAID" | "IMAGE";

export interface BlockInput {
  type: BlockType;
  content: string;
  language?: string | null;
  caption?: string | null;
}

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  language: string | null;
  caption: string | null;
}
