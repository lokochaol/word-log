"use client";

import { useState, useTransition } from "react";
import { useOffline } from "next/offline";
import { BlocksEditor } from "@/components/BlocksEditor";
import { PendingLiteratureMemoField } from "@/components/PendingLiteratureMemoField";
import { createQuickNoteWithBlocksAction } from "@/app/scratch/actions";
import type { Block, BlockInput, QuickNoteSummary } from "@/lib/quickNotes";
import type { LiteratureSelection } from "@/lib/literatureMemos";
import { useI18n } from "@/lib/i18n/LocaleProvider";

function previewFrom(blocks: Block[]): string {
  const first = blocks.find((b) => b.content.trim().length > 0);
  return first?.content.slice(0, 200) ?? "";
}

/**
 * One not-yet-synced 走り書き, rendered as its own row in the timeline right
 * alongside already-synced notes. Each card owns an independent save
 * transition, so starting a second (or third) draft never has to wait for an
 * earlier one's save to finish — offline or just slow, it's the same await
 * either way, which is what lets this component stay ignorant of network
 * state beyond the label it shows. BlocksEditor only disables its own Save
 * button while `saving` is true, not the textareas, so the content stays
 * editable for as long as the note remains local.
 *
 * Also lets a 文献メモ be linked before the note ever exists server-side
 * (PendingLiteratureMemoField), matching what the /scratch/[id] detail
 * page's editor offers — the picked LiteratureSelection just rides along
 * with the blocks into createQuickNoteWithBlocksAction.
 */
export function PendingQuickNoteCard({
  onSynced,
  onDiscard,
}: {
  onSynced: (note: QuickNoteSummary) => void;
  onDiscard: () => void;
}) {
  const { t } = useI18n();
  const isOffline = useOffline();
  const [saving, startTransition] = useTransition();
  const [literatureSelection, setLiteratureSelection] = useState<LiteratureSelection | null>(null);

  function handleSave(blocks: BlockInput[]): Promise<void> {
    // BlocksEditor awaits this before it exits edit mode (`await onSave(...);
    // setEditing(false)`) — startTransition itself doesn't return a promise
    // that waits for its callback, so without this wrapper BlocksEditor would
    // flip out of edit mode the instant this function returns, well before
    // createQuickNoteWithBlocksAction actually resolves, and fall back to
    // its `blocks={[]}` empty-state prompt for the whole real wait.
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          const note = await createQuickNoteWithBlocksAction(blocks, literatureSelection);
          onSynced({
            id: note.id,
            source: note.source,
            encounteredAt: note.encounteredAt,
            preview: previewFrom(note.blocks),
            hasLiterature: !!note.literatureMemo,
            literatureCitation: note.literatureMemo?.citation ?? null,
          });
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  return (
    <div className="relative w-full max-w-[420px]">
      <div className="rounded-lg border border-dashed border-accent/60 bg-surface-alt p-4">
        <p className="mb-3 flex items-center gap-1.5 font-mono text-[10px] text-accent">
          <span aria-hidden="true" className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-accent" />
          {saving ? (isOffline ? t.common.savingOffline : t.scratch.pendingSaveLabel) : t.scratch.pendingDraftLabel}
        </p>
        <BlocksEditor
          blocks={[]}
          startInEditMode
          onSave={handleSave}
          onCancel={onDiscard}
          saving={saving}
          savingLabel={isOffline ? t.common.savingOffline : undefined}
          emptyLabel={t.blocksEditor.addBlock}
        />
        <div className="mt-3 border-t border-line pt-3">
          <h3 className="mb-2 font-mono text-[9.5px] font-semibold tracking-[0.2em] text-ink-soft uppercase">
            <span className="text-accent">{"//"}</span> {t.scratch.literatureHeading}
          </h3>
          <PendingLiteratureMemoField selection={literatureSelection} onChange={setLiteratureSelection} />
        </div>
      </div>
    </div>
  );
}
