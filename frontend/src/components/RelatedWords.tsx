"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { addRelatedWordAction, removeRelatedWordAction } from "@/app/actions";
import type { RelatedWord } from "@/lib/api";

export function RelatedWords({ wordId, relatedWords }: { wordId: string; relatedWords: RelatedWord[] }) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {relatedWords.map((rel) =>
          rel.wordId ? (
            <Link
              key={rel.relationId}
              href={`/words/${rel.wordId}`}
              className="group inline-flex items-center gap-1.5 rounded-full border border-link bg-link-soft px-3 py-1.5 text-xs font-medium text-link transition-transform hover:scale-105"
            >
              {rel.text}
              <span className="font-mono text-[9px] text-link/70">→</span>
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
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={pending}
          placeholder="＋ 関連語を追加してEnter"
          className="w-full rounded-lg border border-dashed border-line bg-surface px-4 py-2.5 text-xs text-ink placeholder:text-ink-soft transition-all duration-200 focus:border-accent focus:border-solid focus:shadow-[0_0_0_4px_var(--color-accent-soft)] focus:outline-none"
        />
      </form>
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
