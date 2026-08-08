"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { searchWordsAction } from "@/app/actions";
import type { SearchResult } from "@/lib/api";

export function SearchClient({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const handle = setTimeout(() => {
      startTransition(async () => {
        const r = await searchWordsAction(q);
        setResults(r);
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  const trimmed = query.trim();
  const hasExactMatch =
    !!results && results.some((r) => r.text.localeCompare(trimmed, undefined, { sensitivity: "base" }) === 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-5 py-4 text-sm text-ink-soft shadow-sm transition-all duration-200 focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--color-accent-soft)]">
        <span aria-hidden="true">🔍</span>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="単語・意味・関連語で検索…"
          className="w-full bg-transparent text-ink placeholder:text-ink-soft focus:outline-none"
        />
      </div>

      {trimmed && results && results.length > 0 && (
        <div className="flex flex-col">
          {results.map((r) => (
            <Link
              key={r.id}
              href={`/words/${r.id}`}
              className="group flex items-baseline gap-4 border-b border-line py-3 transition-colors hover:bg-surface"
            >
              <span className="w-36 shrink-0 text-[15px] font-bold text-ink group-hover:text-accent">
                {r.text}
              </span>
              <span className="truncate text-xs text-ink-soft">{r.meaning || "意味未記入"}</span>
            </Link>
          ))}
        </div>
      )}

      {trimmed && !hasExactMatch && !pending && (
        <div
          className={
            results && results.length > 0
              ? "flex items-center justify-between rounded-lg border border-dashed border-line px-4 py-3"
              : "flex flex-col items-center gap-4 py-16 text-center"
          }
        >
          {results && results.length > 0 ? (
            <>
              <span className="text-xs text-ink-soft">見出し語「{trimmed}」自体は未登録です</span>
              <QuickAddButton text={trimmed} />
            </>
          ) : (
            <>
              <span className="text-sm text-ink-soft">「{trimmed}」に一致する単語はありません</span>
              <QuickAddButton text={trimmed} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function QuickAddButton({ text }: { text: string }) {
  return (
    <Link
      href={`/words/new?text=${encodeURIComponent(text)}`}
      className="inline-flex items-center rounded-lg bg-accent px-4 py-2.5 text-xs font-semibold text-on-accent transition-transform hover:scale-[1.03] active:scale-[0.97]"
    >
      ＋「{text}」を新規登録
    </Link>
  );
}
