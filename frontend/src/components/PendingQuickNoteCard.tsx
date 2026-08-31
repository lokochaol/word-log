"use client";

import { useRef, useState } from "react";
import { useOffline } from "next/offline";
import { MarkdownNoteEditor } from "@/components/MarkdownNoteEditor";
import { PendingLiteratureMemoField } from "@/components/PendingLiteratureMemoField";
import {
  createQuickNoteWithContentAction,
  updateQuickNoteContentAction,
  deleteQuickNoteAction,
  setLiteratureMemoAction,
} from "@/app/scratch/actions";
import type { LiteratureSelection } from "@/lib/literatureMemos";
import { useI18n } from "@/lib/i18n/LocaleProvider";

/**
 * One not-yet-synced 走り書き, rendered inline in the timeline. The very
 * first autosave has to *create* the note (there's no id yet); every one
 * after that just replaces its content. This card deliberately never
 * "graduates" into a normal collapsed timeline row on its own once that
 * first save lands: doing so mid-typing (autosave fires on every pause, not
 * just when you're done) would yank the open editor out from under whoever's
 * still writing. It just stays open until the owner navigates away (a real
 * page load then shows it correctly as a synced note, same as any other).
 */
export function PendingQuickNoteCard({ onDiscard }: { onDiscard: () => void }) {
  const { t } = useI18n();
  const isOffline = useOffline();
  const noteIdRef = useRef<string | null>(null);
  const [literatureSelection, setLiteratureSelectionState] = useState<LiteratureSelection | null>(null);
  const [discarding, setDiscarding] = useState(false);

  async function handleSave(content: string) {
    if (!noteIdRef.current) {
      const note = await createQuickNoteWithContentAction(content, literatureSelection);
      noteIdRef.current = note.id;
    } else {
      await updateQuickNoteContentAction(noteIdRef.current, content);
    }
  }

  async function handleLiteratureChange(selection: LiteratureSelection | null) {
    setLiteratureSelectionState(selection);
    if (noteIdRef.current) {
      await setLiteratureMemoAction(noteIdRef.current, selection ?? { type: "none" });
    }
  }

  async function handleDiscard() {
    if (noteIdRef.current) {
      setDiscarding(true);
      try {
        await deleteQuickNoteAction(noteIdRef.current);
      } finally {
        setDiscarding(false);
      }
    }
    onDiscard();
  }

  return (
    <div className="w-full max-w-[420px]">
      <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface-alt p-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] tracking-widest text-ink-faint uppercase">
            {t.scratch.pendingDraftLabel}
          </span>
          <button
            onClick={handleDiscard}
            disabled={discarding}
            className="font-mono text-[10px] text-ink-soft transition-colors hover:text-accent disabled:opacity-50"
          >
            {t.common.delete}
          </button>
        </div>
        <MarkdownNoteEditor content="" onSave={handleSave} savingLabelOverride={isOffline ? t.common.savingOffline : undefined} />
        <div className="border-t border-line pt-3">
          <PendingLiteratureMemoField selection={literatureSelection} onChange={handleLiteratureChange} />
        </div>
      </div>
    </div>
  );
}
