"use client";

import { useTransition } from "react";
import { BlocksEditor } from "@/components/BlocksEditor";
import { replaceQuickNoteBlocksAction } from "@/app/scratch/actions";
import type { Block, BlockInput } from "@/lib/quickNotes";
import { useI18n } from "@/lib/i18n/LocaleProvider";

export function QuickNoteBlocksSection({ noteId, blocks }: { noteId: string; blocks: Block[] }) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();

  function save(next: BlockInput[]) {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        await replaceQuickNoteBlocksAction(noteId, next);
        resolve();
      });
    });
  }

  return <BlocksEditor blocks={blocks} onSave={save} saving={pending} emptyLabel={t.promotionEditor.contentEmptyLabel} />;
}
