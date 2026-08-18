"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type CSSProperties } from "react";
import { NoteTimeline } from "@/components/NoteTimeline";
import { QuickNoteActionMenu } from "@/components/QuickNoteActionMenu";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AddQuickNoteButton } from "@/components/AddQuickNoteButton";
import { deleteQuickNoteAction } from "@/app/scratch/actions";
import type { QuickNoteSummary } from "@/lib/quickNotes";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { localeTag } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/types";

function formatDate(date: Date, locale: Locale) {
  return date.toLocaleString(localeTag(locale), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** /scratch's timeline — extracted to a client component so each card can
 * carry a corner 編集/削除 menu (編集 navigates to the full detail page,
 * 削除 removes it in place) alongside the existing "+" add button. */
export function ScratchTimeline({ initialNotes }: { initialNotes: QuickNoteSummary[] }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [notes, setNotes] = useState(initialNotes);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  function confirmDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    startDeleteTransition(async () => {
      await deleteQuickNoteAction(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setDeleteTargetId(null);
    });
  }

  return (
    <div style={{ viewTransitionName: "note-timeline" } as CSSProperties}>
      <NoteTimeline
        emptyLabel={t.scratch.emptyTimeline}
        rows={notes.map((note) => ({
          key: note.id,
          meta: (
            <span className="font-mono text-[10px] tracking-wider text-ink-soft">
              {formatDate(note.encounteredAt, locale)}
            </span>
          ),
          card: (
            <div className="relative w-full max-w-[420px]">
              <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface-alt p-4 text-sm text-ink">
                {note.preview || t.common.noContent}
                {note.literatureCitation && (
                  <span className="flex items-start gap-1.5 border-t border-line pt-2 font-mono text-[10.5px] text-ink-soft">
                    <span className="shrink-0 text-accent">📖</span>
                    <span className="line-clamp-1">{note.literatureCitation}</span>
                  </span>
                )}
              </div>
              <QuickNoteActionMenu
                onEdit={() => router.push(`/scratch/${note.id}`)}
                onDelete={() => setDeleteTargetId(note.id)}
              />
              <ConfirmDialog
                open={deleteTargetId === note.id}
                title={t.scratch.deleteConfirmTitle}
                warning={t.scratch.deleteConfirmWarning}
                confirmLabel={t.common.delete}
                onCancel={() => setDeleteTargetId(null)}
                onConfirm={confirmDelete}
                confirmDisabled={deletePending}
                confirmPending={deletePending}
              />
            </div>
          ),
        }))}
      />

      <AddQuickNoteButton />
    </div>
  );
}
