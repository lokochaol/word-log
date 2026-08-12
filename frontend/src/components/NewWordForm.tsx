"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { createWordAction, findExactMatch } from "@/app/actions";
import type { SearchResult } from "@/lib/words";

export function NewWordForm({ initialText = "" }: { initialText?: string }) {
  const [text, setText] = useState(initialText);
  const [duplicate, setDuplicate] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const handle = setTimeout(() => {
      findExactMatch(trimmed).then(setDuplicate).catch(() => setDuplicate(null));
    }, 300);
    return () => clearTimeout(handle);
  }, [text]);

  const trimmedText = text.trim();
  const visibleDuplicate = trimmedText ? duplicate : null;

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createWordAction(formData);
          if (result?.error) setError(result.error);
        });
      }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="text" className="text-[10.5px] font-semibold tracking-wider text-ink-soft uppercase">
          単語 *
        </label>
        <input
          id="text"
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="例）serendipity"
          autoFocus
          required
          className="rounded-lg border border-line bg-surface px-4 py-3 text-base text-ink shadow-sm transition-all duration-200 focus:border-accent focus:shadow-[0_0_0_4px_var(--color-accent-soft)] focus:outline-none"
        />

        {visibleDuplicate && (
          <div className="flex items-center justify-between rounded-lg bg-accent-soft px-3 py-2 text-xs text-ink">
            <span>⚠ すでに「{visibleDuplicate.text}」は登録済みです</span>
            <Link href={`/words/${visibleDuplicate.id}`} className="font-semibold text-accent hover:underline">
              詳細を見る →
            </Link>
          </div>
        )}

        {error && <p className="text-xs text-accent">{error}</p>}
      </div>

      <div className="flex justify-end gap-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-alt"
        >
          キャンセル
        </Link>
        <button
          type="submit"
          disabled={pending || !text.trim()}
          className="btn-sheen inline-flex items-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 disabled:hover:scale-100"
        >
          {pending ? "記録中…" : "出会いを記録"}
        </button>
      </div>
    </form>
  );
}
