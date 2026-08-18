"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { LiteratureMemoPicker } from "@/components/LiteratureMemoPicker";
import { LoadingBlock, Spinner } from "@/components/LoadingSpinner";
import { addPermanentNoteLiteratureAction, removePermanentNoteLiteratureAction } from "@/app/zettelkasten/actions";
import { updateLiteratureMemoSummaryAction } from "@/app/literature/actions";
import type { LiteratureMemoRef, LiteratureSelection } from "@/lib/literatureMemos";

/**
 * 文献メモ section on an existing PermanentNote's detail view. Unlike
 * QuickNote's single-link LiteratureMemoField, a PermanentNote can carry
 * several literature memos, so this manages a list: each linked memo is a
 * card with its own (shared, persisted immediately) summary editor and an
 * "解除" to drop just that one link, plus a picker to add more.
 */
export function PermanentNoteLiteratureSection({
  noteId,
  literatureMemos,
}: {
  noteId: string;
  literatureMemos: LiteratureMemoRef[];
}) {
  const [memos, setMemos] = useState(literatureMemos);
  const [pickerOpen, setPickerOpen] = useState(memos.length === 0);
  const [pickPending, startPickTransition] = useTransition();

  function handlePick(selection: LiteratureSelection) {
    if (selection.type === "none") return;
    startPickTransition(async () => {
      const note = await addPermanentNoteLiteratureAction(noteId, selection);
      setMemos(note.literatureMemos);
      setPickerOpen(false);
    });
  }

  function handleRemove(memoId: string) {
    startPickTransition(async () => {
      const note = await removePermanentNoteLiteratureAction(noteId, memoId);
      setMemos(note.literatureMemos);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {memos.map((memo) => (
        <LiteratureMemoCard key={memo.id} memo={memo} onRemove={() => handleRemove(memo.id)} />
      ))}

      {!pickerOpen && (
        <button
          onClick={() => setPickerOpen(true)}
          className="w-fit rounded-lg border border-dashed border-line px-3 py-2 text-left font-mono text-[10.5px] text-ink-soft transition-colors hover:border-accent hover:text-accent"
        >
          ＋ 文献メモをリンク
        </button>
      )}

      {pickerOpen && (
        <div className="flex flex-col gap-2">
          {memos.length > 0 && (
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

function LiteratureMemoCard({ memo, onRemove }: { memo: LiteratureMemoRef; onRemove: () => void }) {
  const [summary, setSummary] = useState(memo.summary ?? "");
  const [savePending, startSaveTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function saveSummary() {
    startSaveTransition(async () => {
      await updateLiteratureMemoSummaryAction(memo.id, summary);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
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
        <button onClick={onRemove} className="shrink-0 font-mono text-[10px] text-ink-soft hover:text-accent">
          解除
        </button>
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
            onClick={saveSummary}
            className="btn-sheen flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-on-accent transition-transform hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
          >
            {savePending && <Spinner size="xs" />}
            {savePending ? "保存中…" : saved ? "保存しました" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
