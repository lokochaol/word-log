"use client";

import { useState, useTransition } from "react";
import { updateMeaningAction } from "@/app/actions";

export function MeaningEditor({ wordId, meaning }: { wordId: string; meaning: string | null }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(meaning ?? "");
  const [pending, startTransition] = useTransition();

  if (!editing && !meaning) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full rounded-lg border border-dashed border-line bg-surface py-6 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft"
      >
        ＋ 意味を入力
      </button>
    );
  }

  if (!editing) {
    return (
      <button
        onClick={() => {
          setValue(meaning ?? "");
          setEditing(true);
        }}
        className="w-full rounded-lg border border-line bg-surface px-4 py-4 text-left text-sm leading-relaxed text-ink transition-colors hover:border-line-strong"
      >
        {meaning}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <textarea
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={5}
        placeholder="自分の言葉での意味、出会った文脈のメモなど"
        className="w-full resize-none rounded-lg border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-ink shadow-sm transition-all duration-200 focus:border-accent focus:shadow-[0_0_0_4px_var(--color-accent-soft)] focus:outline-none"
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setEditing(false)}
          className="rounded-lg border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-surface-alt"
        >
          キャンセル
        </button>
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await updateMeaningAction(wordId, value);
              setEditing(false);
            })
          }
          className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-on-accent transition-transform hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
        >
          {pending ? "保存中…" : "保存"}
        </button>
      </div>
    </div>
  );
}
