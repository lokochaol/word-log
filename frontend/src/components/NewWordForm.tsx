"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { createWordAction, findExactMatch } from "@/app/actions";
import type { SearchResult } from "@/lib/words";
import { HudFrame } from "@/components/HudFrame";

export function NewWordForm({ initialText = "" }: { initialText?: string }) {
  const [text, setText] = useState(initialText);
  const [duplicate, setDuplicate] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
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
        <label
          htmlFor="text"
          className="font-mono text-[10.5px] font-semibold tracking-[0.15em] text-ink-soft uppercase"
        >
          単語 <span className="text-accent">*</span>
        </label>

        <HudFrame active={focused} innerClassName="flex items-center gap-2 rounded-xl px-4 py-3">
          <span aria-hidden="true" className="shrink-0 font-mono text-sm text-accent">
            &gt;
          </span>
          <input
            id="text"
            name="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="例）serendipity"
            autoComplete="off"
            autoFocus
            required
            style={{ caretColor: "var(--color-accent)" }}
            className="w-full bg-transparent font-mono text-base text-ink placeholder:font-sans placeholder:text-ink-soft focus:outline-none"
          />
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-300 ${
              pending ? "animate-pulse-dot bg-accent" : "bg-transparent"
            }`}
          />
        </HudFrame>

        {visibleDuplicate && (
          <div className="flex items-center justify-between rounded-lg border border-accent/40 bg-accent-soft px-3 py-2 font-mono text-xs text-ink">
            <span>⚠ すでに「{visibleDuplicate.text}」は登録済みです</span>
            <Link href={`/words/${visibleDuplicate.id}`} className="font-semibold text-accent hover:underline">
              詳細を見る →
            </Link>
          </div>
        )}

        {error && <p className="font-mono text-xs text-accent">{error}</p>}
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
