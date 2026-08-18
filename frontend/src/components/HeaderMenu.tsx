"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Wraps a header's nav items (brand-adjacent links, locale toggle, sign-out,
 * etc.): shown as a normal horizontal row on wide screens, collapsed behind
 * a single menu button on narrow/portrait ones where the row would otherwise
 * overflow. The trigger button keeps a continuous, gentle scale-pulse so it
 * still reads as tappable even without hover — the same "this is a live
 * control" cue other tap-to-open menus in the app (e.g. QuickNoteActionMenu)
 * give on hover, just always-on since touch has no hover state.
 */
export function HeaderMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <>
      <div className="hidden flex-wrap items-center gap-x-2 gap-y-1.5 sm:flex">{children}</div>

      <div ref={ref} className="relative sm:hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          aria-expanded={open}
          className={`relative flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
            open ? "border-accent bg-accent-soft" : "border-accent/60 bg-surface"
          }`}
        >
          <span aria-hidden="true" className="animate-breathe-scale absolute inset-0 rounded-full border border-accent/50" />
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="relative">
            <path
              d="M1.5 3.5H12.5M1.5 7H12.5M1.5 10.5H12.5"
              stroke="#ff3d1a"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {open && (
          <div
            onClick={() => setOpen(false)}
            className="absolute top-10 right-0 z-30 flex min-w-[190px] flex-col items-end gap-2.5 rounded-lg border border-line-strong bg-surface p-3.5 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.85)]"
          >
            {children}
          </div>
        )}
      </div>
    </>
  );
}
