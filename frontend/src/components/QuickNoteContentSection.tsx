"use client";

import { MarkdownNoteEditor } from "@/components/MarkdownNoteEditor";
import { updateQuickNoteContentAction } from "@/app/scratch/actions";

export function QuickNoteContentSection({ noteId, content }: { noteId: string; content: string }) {
  async function save(next: string) {
    await updateQuickNoteContentAction(noteId, next);
  }

  return <MarkdownNoteEditor content={content} onSave={save} />;
}
