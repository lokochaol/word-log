"use client";

import { useState } from "react";
import { LiteratureMemoPicker } from "@/components/LiteratureMemoPicker";
import type { DraftLiteratureSelection, LiteratureSelection } from "@/lib/literatureMemos";

export type { DraftLiteratureSelection } from "@/lib/literatureMemos";

/**
 * 文献メモ field for a not-yet-created PermanentNote draft inside the
 * promotion editor — purely client-side state until the draft is submitted;
 * `literatureMemos.resolveSelections` only runs (inside the promotion
 * transaction) once the note actually exists. Optional — never required for
 * a draft to be valid. A draft can carry SEVERAL literature memos (e.g. when
 * several selected 走り書き, each citing something different, get merged
 * into one draft — every distinct citation carries over).
 *
 * Judgment call: the summary textarea only appears for a *new* citation
 * (Zotero pick or manual entry), since that's the one path where the memo
 * row doesn't exist yet anywhere and this form is the only chance to set it
 * at creation time. An "existing" pick reuses a memo whose summary is
 * already shared across other notes — editing it here would be silently
 * rewriting that shared text from an unrelated draft screen, so instead it's
 * shown read-only with a pointer to /literature/[id] once the draft is saved.
 */
export function LiteratureMemoDraftField({
  selections,
  onChange,
}: {
  selections: DraftLiteratureSelection[];
  onChange: (selections: DraftLiteratureSelection[]) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  function handlePick(sel: LiteratureSelection) {
    if (sel.type === "none") return;
    // Picking the same "existing" memo twice is a no-op, not a duplicate entry.
    if (sel.type === "existing" && selections.some((s) => s.type === "existing" && s.id === sel.id)) {
      setPickerOpen(false);
      return;
    }
    onChange([...selections, sel]);
    setPickerOpen(false);
  }

  function updateAt(index: number, patch: Partial<DraftLiteratureSelection>) {
    onChange(selections.map((s, i) => (i === index ? ({ ...s, ...patch } as DraftLiteratureSelection) : s)));
  }

  function removeAt(index: number) {
    onChange(selections.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      {selections.map((selection, i) => {
        const summaryEditable = selection.type === "zotero" || selection.type === "manual";
        return (
          <div key={i} className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-2.5">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-[11.5px] font-semibold break-words text-ink">
                {selection.type === "existing" ? (selection.citation ?? "選択済み文献メモ") : selection.citation}
              </p>
              <button onClick={() => removeAt(i)} className="shrink-0 font-mono text-[10px] text-ink-soft hover:text-accent">
                解除
              </button>
            </div>

            {summaryEditable ? (
              <textarea
                value={selection.summary ?? ""}
                onChange={(e) => updateAt(i, { summary: e.target.value })}
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
        );
      })}

      {!pickerOpen && (
        <button
          onClick={() => setPickerOpen(true)}
          className="w-fit rounded-lg border border-dashed border-line px-2.5 py-1.5 text-left font-mono text-[10px] text-ink-soft transition-colors hover:border-accent hover:text-accent"
        >
          ＋ 文献メモをリンク
        </button>
      )}

      {pickerOpen && (
        <div className="flex flex-col gap-2">
          <button onClick={() => setPickerOpen(false)} className="w-fit font-mono text-[10px] text-ink-soft hover:text-accent">
            ✕ キャンセル
          </button>
          <LiteratureMemoPicker onPick={handlePick} />
        </div>
      )}
    </div>
  );
}
