"use client";

import { useState } from "react";
import { LiteratureMemoPicker } from "@/components/LiteratureMemoPicker";
import type { LiteratureSelection } from "@/lib/literatureMemos";

/** A draft never holds the "none" selection variant — clearing it just sets `undefined`. */
export type DraftLiteratureSelection = Exclude<LiteratureSelection, { type: "none" }>;

/**
 * 文献メモ field for a not-yet-created PermanentNote draft inside the
 * promotion editor — purely client-side state until the draft is submitted;
 * `literatureMemos.resolveSelection` only runs (inside the promotion
 * transaction) once the note actually exists. Optional — never required for
 * a draft to be valid.
 *
 * Judgment call: the summary textarea only appears for a *new* citation
 * (Zotero pick or manual entry), since that's the one path where the memo
 * row doesn't exist yet anywhere and this form is the only chance to set it
 * at creation time. Picking "既存の文献メモから選ぶ" reuses a memo whose
 * summary is already shared across other notes — editing it here would be
 * silently rewriting that shared text from an unrelated draft screen, so
 * instead it's shown read-only with a pointer to /literature/[id] once the
 * draft is saved.
 */
export function LiteratureMemoDraftField({
  selection,
  onChange,
}: {
  selection: DraftLiteratureSelection | undefined;
  onChange: (selection: DraftLiteratureSelection | undefined) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(!selection);

  function handlePick(sel: LiteratureSelection) {
    onChange(sel.type === "none" ? undefined : sel);
    setPickerOpen(false);
  }

  const summaryEditable = selection?.type === "zotero" || selection?.type === "manual";

  return (
    <div className="flex flex-col gap-2">
      {selection && !pickerOpen && (
        <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-2.5">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 text-[11.5px] font-semibold break-words text-ink">
              {selection.type === "existing" ? "選択済み文献メモ" : selection.citation}
            </p>
            <div className="flex shrink-0 gap-2">
              <button onClick={() => setPickerOpen(true)} className="font-mono text-[10px] text-ink-soft hover:text-accent">
                変更
              </button>
              <button onClick={() => onChange(undefined)} className="font-mono text-[10px] text-ink-soft hover:text-accent">
                解除
              </button>
            </div>
          </div>

          {summaryEditable ? (
            <textarea
              value={selection.summary ?? ""}
              onChange={(e) =>
                onChange(
                  selection.type === "zotero"
                    ? { ...selection, summary: e.target.value }
                    : { ...selection, summary: e.target.value },
                )
              }
              placeholder="本に書いてあったこと（自分の言葉で）"
              rows={2}
              className="w-full resize-none rounded-md border border-line bg-surface-alt px-2.5 py-1.5 text-xs text-ink focus:border-accent focus:outline-none"
            />
          ) : (
            <p className="font-mono text-[9.5px] text-ink-faint">
              既存の文献メモを再利用します。概要はメモ作成後、文献メモの詳細ページから編集できます。
            </p>
          )}
        </div>
      )}

      {!selection && !pickerOpen && (
        <button
          onClick={() => setPickerOpen(true)}
          className="w-fit rounded-lg border border-dashed border-line px-2.5 py-1.5 text-left font-mono text-[10px] text-ink-soft transition-colors hover:border-accent hover:text-accent"
        >
          ＋ 文献メモをリンク（任意）
        </button>
      )}

      {pickerOpen && (
        <div className="flex flex-col gap-2">
          {selection && (
            <button onClick={() => setPickerOpen(false)} className="w-fit font-mono text-[10px] text-ink-soft hover:text-accent">
              ✕ キャンセル
            </button>
          )}
          <LiteratureMemoPicker onPick={handlePick} />
        </div>
      )}
    </div>
  );
}
