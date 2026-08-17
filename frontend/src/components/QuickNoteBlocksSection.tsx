"use client";

import { useTransition } from "react";
import { BlocksEditor } from "@/components/BlocksEditor";
import { replaceQuickNoteBlocksAction } from "@/app/scratch/actions";
import type { Block, BlockInput } from "@/lib/quickNotes";

export function QuickNoteBlocksSection({ noteId, blocks }: { noteId: string; blocks: Block[] }) {
  const [pending, startTransition] = useTransition();

  function save(next: BlockInput[]) {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        await replaceQuickNoteBlocksAction(noteId, next);
        resolve();
      });
    });
  }

  return <BlocksEditor blocks={blocks} onSave={save} saving={pending} emptyLabel="＋ 内容を入力" />;
}
