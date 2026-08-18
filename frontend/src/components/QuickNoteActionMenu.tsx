"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Small corner button (outside the note card, top-right) that expands into
 * an 編集/削除 menu — used on both /scratch's timeline and Zettelkasten's ③
 * column so every quick-note card has the same action entry point.
 */
export function QuickNoteActionMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
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
    <div ref={ref} className="absolute top-0 -right-11 z-10">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="操作"
        className="flex h-7 w-7 items-center justify-center rounded-full border border-accent/60 bg-surface text-accent shadow-[0_0_10px_-3px_var(--color-accent)] transition-transform hover:scale-110"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      </button>

      {open && (
        <div className="absolute top-8 right-0 flex flex-col overflow-hidden rounded-lg border border-line-strong bg-surface shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)]">
          <button
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="whitespace-nowrap px-3.5 py-2 text-left font-mono text-[10.5px] text-ink-soft transition-colors hover:bg-surface-alt hover:text-ink"
          >
            編集
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="whitespace-nowrap border-t border-line px-3.5 py-2 text-left font-mono text-[10.5px] text-ink-soft transition-colors hover:bg-surface-alt hover:text-accent"
          >
            削除
          </button>
        </div>
      )}
    </div>
  );
}
