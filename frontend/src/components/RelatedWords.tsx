"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { addRelatedWordAction, removeRelatedWordAction, suggestRelatedWordsAction } from "@/app/actions";
import type { RelatedSuggestion, RelatedWord } from "@/lib/words";
import { HudFrame } from "@/components/HudFrame";

const REASON_LABEL: Record<RelatedSuggestion["reason"], string> = {
  FUZZY_MATCH: "曖昧一致",
  REVERSE_RELATION: "関連語経由",
};

export function RelatedWords({ wordId, relatedWords }: { wordId: string; relatedWords: RelatedWord[] }) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [suggestions, setSuggestions] = useState<RelatedSuggestion[] | null>(null);
  const loadingSuggestions = suggestions === null;

  useEffect(() => {
    let cancelled = false;
    suggestRelatedWordsAction(wordId).then((result) => {
      if (!cancelled) setSuggestions(result);
    });
    return () => {
      cancelled = true;
    };
    // relatedWords.length is intentionally included: re-poll suggestions after a
    // related word is added or removed so already-linked candidates drop out.
  }, [wordId, relatedWords.length]);

  function addSuggestion(s: RelatedSuggestion) {
    setSuggestions((prev) => (prev ? prev.filter((x) => x.wordId !== s.wordId) : prev));
    startTransition(() => addRelatedWordAction(wordId, s.text));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {relatedWords.map((rel) =>
          rel.wordId ? (
            <Link
              key={rel.relationId}
              href={`/words/${rel.wordId}`}
              className="group inline-flex items-center gap-1.5 rounded-full border border-link bg-link-soft px-3 py-1.5 text-xs font-medium text-link transition-all hover:scale-105 hover:border-accent hover:text-accent hover:shadow-[0_0_16px_-6px_var(--color-accent)]"
            >
              {rel.text}
              <span className="font-mono text-[9px] opacity-70">→</span>
              <RemoveButton
                onClick={() =>
                  startTransition(() => removeRelatedWordAction(wordId, rel.relationId))
                }
              />
            </Link>
          ) : (
            <span
              key={rel.relationId}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line px-3 py-1.5 text-xs text-ink-soft"
            >
              {rel.text}
              <span className="font-mono text-[9px]">未登録</span>
              <RemoveButton
                onClick={() =>
                  startTransition(() => removeRelatedWordAction(wordId, rel.relationId))
                }
              />
            </span>
          ),
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const value = text.trim();
          if (!value) return;
          startTransition(async () => {
            await addRelatedWordAction(wordId, value);
            setText("");
            inputRef.current?.focus();
          });
        }}
      >
        <HudFrame active={focused} innerClassName="flex items-center gap-2 rounded-xl px-4 py-2.5">
          <span aria-hidden="true" className="shrink-0 font-mono text-xs text-accent">
            &gt;
          </span>
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={pending}
            autoComplete="off"
            placeholder="関連語を追加してEnter"
            style={{ caretColor: "var(--color-accent)" }}
            className="w-full bg-transparent font-mono text-xs text-ink placeholder:font-sans placeholder:text-ink-soft focus:outline-none"
          />
        </HudFrame>
      </form>

      {(loadingSuggestions || (suggestions && suggestions.length > 0)) && (
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-wider text-ink-soft uppercase">候補（自動検出）</span>
            {loadingSuggestions && (
              <span className="h-2 w-2 animate-pulse-dot rounded-full border border-dashed border-line-strong" />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions?.map((s) => (
              <button
                key={s.wordId}
                onClick={() => addSuggestion(s)}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line px-3 py-1.5 text-xs text-ink-soft transition-all hover:border-accent hover:text-accent hover:shadow-[0_0_16px_-6px_var(--color-accent)] disabled:opacity-50"
              >
                {s.text}
                <span className="font-mono text-[9px]">{REASON_LABEL[s.reason]}</span>
                <span className="font-mono text-[9px]">＋追加</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className="ml-0.5 text-[10px] text-current opacity-50 transition-opacity hover:opacity-100"
    >
      ✕
    </span>
  );
}
