"use client";

import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "@/components/SearchIcon";

export function HomeSearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form action="/search" method="GET">
      <div
        className={`relative flex items-center gap-3 rounded-2xl border bg-surface px-5 py-4 text-sm transition-all duration-300 ${
          focused
            ? "border-accent shadow-[0_0_0_4px_var(--color-accent-soft),0_0_28px_-8px_var(--color-accent)]"
            : "border-line shadow-none"
        }`}
      >
        <SearchIcon active={focused} />
        <input
          ref={inputRef}
          type="text"
          name="q"
          placeholder="単語・意味・関連語で検索…"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent text-ink placeholder:text-ink-soft focus:outline-none"
        />
        <kbd
          aria-hidden="true"
          className={`shrink-0 rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-soft transition-opacity duration-200 ${
            focused ? "opacity-0" : "opacity-100"
          }`}
        >
          /
        </kbd>
      </div>
    </form>
  );
}
