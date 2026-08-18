"use client";

import { useState, useTransition } from "react";
import { NoteTimeline } from "@/components/NoteTimeline";
import { BlocksEditor } from "@/components/BlocksEditor";
import { QuickNoteActionMenu } from "@/components/QuickNoteActionMenu";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LoadingBlock, Spinner } from "@/components/LoadingSpinner";
import {
  createQuickNoteAction,
  deleteQuickNoteAction,
  getQuickNoteDetailAction,
  replaceQuickNoteBlocksAction,
} from "@/app/scratch/actions";
import type { Block, BlockInput, QuickNoteSummary } from "@/lib/quickNotes";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { localeTag } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/types";

function previewFrom(blocks: Block[] | BlockInput[]): string {
  const first = blocks.find((b) => b.content.trim().length > 0);
  return first?.content.slice(0, 200) ?? "";
}

function formatDate(date: Date, locale: Locale) {
  return new Date(date).toLocaleDateString(localeTag(locale));
}

/**
 * The ③ column's quick-note list — unlike /scratch's ScratchTimeline, add/
 * edit/delete all complete inline here (no navigation), since leaving the
 * Zettelkasten screen mid-flow is disruptive. Selection (for promotion) stays
 * owned by the parent; this component owns the notes list + inline editing.
 */
export function QuickNoteInlineTimeline({
  notes,
  onNotesChange,
  selectedIds,
  onToggleSelect,
  onDeleted,
}: {
  notes: QuickNoteSummary[];
  onNotesChange: (notes: QuickNoteSummary[]) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onDeleted: (id: string) => void;
}) {
  const { t, locale } = useI18n();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);
  const [editingBlocks, setEditingBlocks] = useState<Block[]>([]);
  const [savePending, startSaveTransition] = useTransition();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();
  const [creating, setCreating] = useState(false);

  async function startEdit(id: string) {
    setLoadingEditId(id);
    try {
      const detail = await getQuickNoteDetailAction(id);
      setEditingBlocks(detail.blocks);
      setEditingId(id);
    } finally {
      setLoadingEditId(null);
    }
  }

  function saveEdit(id: string, blocks: BlockInput[]) {
    startSaveTransition(async () => {
      const detail = await replaceQuickNoteBlocksAction(id, blocks);
      onNotesChange(
        notes.map((n) =>
          n.id === id
            ? { ...n, preview: previewFrom(detail.blocks), hasLiterature: !!detail.literatureMemo, literatureCitation: detail.literatureMemo?.citation ?? null }
            : n,
        ),
      );
      setEditingId(null);
    });
  }

  function confirmDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    startDeleteTransition(async () => {
      await deleteQuickNoteAction(id);
      onNotesChange(notes.filter((n) => n.id !== id));
      onDeleted(id);
      setDeleteTargetId(null);
      if (editingId === id) setEditingId(null);
    });
  }

  async function addNote() {
    setCreating(true);
    try {
      const detail = await createQuickNoteAction("SCRATCH");
      onNotesChange([
        ...notes,
        {
          id: detail.id,
          source: detail.source,
          encounteredAt: detail.encounteredAt,
          preview: "",
          hasLiterature: false,
          literatureCitation: null,
        },
      ]);
      setEditingBlocks([]);
      setEditingId(detail.id);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <NoteTimeline
        emptyLabel={t.zettelkasten.emptyTimeline}
        rows={notes.map((note) => {
          const isEditing = editingId === note.id;
          const isLoadingEdit = loadingEditId === note.id;
          return {
            key: note.id,
            meta: <span className="font-mono text-[9.5px] text-ink-faint">{formatDate(note.encounteredAt, locale)}</span>,
            card: (
              <div className="relative w-full max-w-[360px]">
                {isEditing ? (
                  <div className="rounded-lg border border-accent/60 bg-surface-alt p-3">
                    <BlocksEditor
                      blocks={editingBlocks}
                      onSave={(blocks) => saveEdit(note.id, blocks)}
                      saving={savePending}
                      startInEditMode
                      emptyLabel={t.promotionEditor.contentEmptyLabel}
                    />
                  </div>
                ) : isLoadingEdit ? (
                  <div className="rounded-lg border border-line bg-surface-alt p-3">
                    <LoadingBlock label={t.common.loading} className="py-1" />
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => onToggleSelect(note.id)}
                      className={`flex w-full flex-col gap-1.5 rounded-lg border p-3 text-left text-xs text-ink transition-colors ${
                        selectedIds.has(note.id)
                          ? "border-accent/70 bg-accent-soft"
                          : "border-line bg-surface-alt hover:border-line-strong"
                      }`}
                    >
                      {note.preview || t.common.noContent}
                      {note.literatureCitation && (
                        <span className="flex items-start gap-1.5 border-t border-line/60 pt-1.5 font-mono text-[9.5px] text-ink-soft">
                          <span className="shrink-0 text-accent">📖</span>
                          <span className="line-clamp-1">{note.literatureCitation}</span>
                        </span>
                      )}
                    </button>
                    <QuickNoteActionMenu onEdit={() => startEdit(note.id)} onDelete={() => setDeleteTargetId(note.id)} />
                    <ConfirmDialog
                      open={deleteTargetId === note.id}
                      title={t.zettelkasten.deleteConfirmTitle}
                      warning={t.zettelkasten.deleteConfirmWarning}
                      confirmLabel={t.common.delete}
                      onCancel={() => setDeleteTargetId(null)}
                      onConfirm={confirmDelete}
                      confirmDisabled={deletePending}
                      confirmPending={deletePending}
                    />
                  </>
                )}
              </div>
            ),
            dotClassName: selectedIds.has(note.id) ? "bg-accent" : "",
          };
        })}
      />

      <button
        onClick={addNote}
        disabled={creating}
        className="btn-sheen mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-accent/50 px-3 py-2.5 text-center font-mono text-xs font-semibold text-accent transition-colors hover:border-accent disabled:opacity-50"
      >
        {creating && <Spinner size="xs" />}
        {creating ? t.common.creating : t.zettelkasten.addNote}
      </button>
    </>
  );
}
