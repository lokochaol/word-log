"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { LiteratureMemoPicker } from "@/components/LiteratureMemoPicker";
import { LoadingBlock, Spinner } from "@/components/LoadingSpinner";
import type { LiteratureMemoRef, LiteratureSelection } from "@/lib/literatureMemos";

/**
 * 文献メモ section on an existing QuickNote's or PermanentNote's detail view.
 * Generalizes the old QuickNote-only LiteratureMemoEditor onto the shared
 * LiteratureMemo entity: `onPick` persists a new link immediately (Server
 * Action), `onSaveSummary` persists an edit to the *shared* summary text —
 * which is visible to every other note linking the same memo.
 */
export function LiteratureMemoField({
  linked,
  onPick,
  onSaveSummary,
}: {
  linked: LiteratureMemoRef | null;
  onPick: (selection: LiteratureSelection) => Promise<{ literatureMemo: LiteratureMemoRef | null }>;
  onSaveSummary: (memoId: string, summary: string) => Promise<void>;
}) {
  const [memo, setMemo] = useState(linked);
  const [pickerOpen, setPickerOpen] = useState(!linked);
  const [summary, setSummary] = useState(linked?.summary ?? "");
  const [pickPending, startPickTransition] = useTransition();
  const [savePending, startSaveTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handlePick(selection: LiteratureSelection) {
    startPickTransition(async () => {
      const res = await onPick(selection);
      setMemo(res.literatureMemo);
      setSummary(res.literatureMemo?.summary ?? "");
      setPickerOpen(false);
    });
  }

  function handleSaveSummary() {
    if (!memo) return;
    startSaveTransition(async () => {
      await onSaveSummary(memo.id, summary);
      setMemo({ ...memo, summary: summary.trim() || null });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {memo && !pickerOpen && (
        <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface-alt p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold break-words text-ink">{memo.citation}</p>
              {memo.url && (
                <a
                  href={memo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block font-mono text-[10.5px] text-accent underline break-all"
                >
                  {memo.url}
                </a>
              )}
              <div className="mt-1 flex gap-3">
                <Link href={`/literature/${memo.id}`} className="font-mono text-[10px] text-ink-soft underline hover:text-accent">
                  文献メモを開く →
                </Link>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button onClick={() => setPickerOpen(true)} className="font-mono text-[10px] text-ink-soft hover:text-accent">
                変更
              </button>
              <button
                disabled={pickPending}
                onClick={() => handlePick({ type: "none" })}
                className="font-mono text-[10px] text-ink-soft hover:text-accent disabled:opacity-50"
              >
                解除
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[9.5px] tracking-wider text-ink-faint uppercase">
              文献に書いてあったこと（自分の言葉で） — この文献メモを参照する全ノートで共有されます
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                disabled={savePending}
                onClick={handleSaveSummary}
                className="btn-sheen flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-on-accent transition-transform hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
              >
                {savePending && <Spinner size="xs" />}
                {savePending ? "保存中…" : saved ? "保存しました" : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!memo && !pickerOpen && (
        <button
          onClick={() => setPickerOpen(true)}
          className="w-fit rounded-lg border border-dashed border-line px-3 py-2 text-left font-mono text-[10.5px] text-ink-soft transition-colors hover:border-accent hover:text-accent"
        >
          ＋ 文献メモをリンク
        </button>
      )}

      {pickerOpen && (
        <div className="flex flex-col gap-2">
          {memo && (
            <button onClick={() => setPickerOpen(false)} className="w-fit font-mono text-[10px] text-ink-soft hover:text-accent">
              ✕ キャンセル
            </button>
          )}
          {pickPending ? (
            <LoadingBlock label="リンク中…" className="justify-start py-1" />
          ) : (
            <LiteratureMemoPicker onPick={handlePick} />
          )}
        </div>
      )}
    </div>
  );
}
