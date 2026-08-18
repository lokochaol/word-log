"use client";

import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "@/components/SearchIcon";
import { HudFrame } from "@/components/HudFrame";
import { useI18n } from "@/lib/i18n/LocaleProvider";

export function HomeSearchBar() {
  const { t } = useI18n();
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
      <HudFrame active={focused}>
        <SearchIcon active={focused} />
        <span aria-hidden="true" className="shrink-0 font-mono text-sm text-accent">
          &gt;
        </span>
        <input
          ref={inputRef}
          type="text"
          name="q"
          autoComplete="off"
          placeholder={t.scratch.homeSearchPlaceholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ caretColor: "var(--color-accent)" }}
          className="w-full bg-transparent font-mono text-ink placeholder:font-sans placeholder:text-ink-soft focus:outline-none"
        />
        <kbd
          aria-hidden="true"
          className={`shrink-0 rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-soft transition-opacity duration-200 ${
            focused ? "opacity-0" : "opacity-100"
          }`}
        >
          /
        </kbd>
      </HudFrame>
    </form>
  );
}
