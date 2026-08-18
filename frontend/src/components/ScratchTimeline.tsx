"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type CSSProperties, type ReactNode } from "react";
import { NoteTimeline } from "@/components/NoteTimeline";
import { QuickNoteActionMenu } from "@/components/QuickNoteActionMenu";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AddQuickNoteButton } from "@/components/AddQuickNoteButton";
import { deleteQuickNoteAction } from "@/app/scratch/actions";
import type { QuickNoteSummary } from "@/lib/quickNotes";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { localeTag } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/types";
import { useAutoScrollToBottom } from "@/lib/useAutoScrollToBottom";

function formatDate(date: Date, locale: Locale) {
  return date.toLocaleString(localeTag(locale), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const HEADER_FADE_MASK = "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)";

/** /scratch's timeline — extracted to a client component so each card can
 * carry a corner 編集/削除 menu (編集 navigates to the full detail page,
 * 削除 removes it in place) alongside the existing "+" add button. The
 * screen itself doesn't scroll — only the list does, anchored to the bottom
 * (latest note) by default, matching a chat-style history view. The add
 * button lives inside the scrollable area, after the last note, so it
 * scrolls out of view when scrolling up into history — it isn't a pinned
 * footer here (unlike QuickNoteInlineTimeline's ③ pane).
 *
 * `header` (brand/nav/search) is rendered inside the same scroll container,
 * pinned via `sticky` with a bottom gradient mask — so notes scrolling up
 * don't get clipped by a hard edge, they fade out under the header instead. */
export function ScratchTimeline({ initialNotes, header }: { initialNotes: QuickNoteSummary[]; header: ReactNode }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [notes, setNotes] = useState(initialNotes);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();
  const scrollRef = useAutoScrollToBottom<HTMLDivElement>(notes.length);

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
    <div className="min-h-0 flex-1" style={{ viewTransitionName: "note-timeline" } as CSSProperties}>
      <div ref={scrollRef} className="scrollbar-hidden h-full overflow-y-auto px-4">
        <div
          className="sticky top-0 z-10 -mx-4 flex flex-col gap-6 bg-bg px-4 pt-6 pb-8"
          style={{ maskImage: HEADER_FADE_MASK, WebkitMaskImage: HEADER_FADE_MASK }}
        >
          {header}
        </div>

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
                <button
                  onClick={() => router.push(`/scratch/${note.id}`)}
                  className="flex w-full flex-col gap-2 rounded-lg border border-line bg-surface-alt p-4 text-left text-sm text-ink transition-colors hover:border-line-strong"
                >
                  {note.preview || t.common.noContent}
                  {note.literatureCitation && (
                    <span className="flex items-start gap-1.5 border-t border-line pt-2 font-mono text-[10.5px] text-ink-soft">
                      <span className="shrink-0 text-accent">📖</span>
                      <span className="line-clamp-1">{note.literatureCitation}</span>
                    </span>
                  )}
                </button>
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
    </div>
  );
}
