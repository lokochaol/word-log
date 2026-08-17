"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createQuickNoteAction } from "@/app/scratch/actions";

/**
 * Generalized from the original AddWordButton — same ring/glow HUD
 * treatment, now creates a QuickNote(source: SCRATCH) and lands on its
 * detail page for block + literature-memo editing. A disabled ボイスメモ
 * affordance sits alongside as the Phase 2 schema hook's only UI trace.
 */
export function AddQuickNoteButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function create() {
    startTransition(async () => {
      const note = await createQuickNoteAction("SCRATCH");
      router.push(`/scratch/${note.id}`);
    });
  }

  return (
    <div className="flex flex-col items-center gap-3 pt-14 pb-4">
      <div className="flex items-center gap-6">
        <button onClick={create} disabled={pending} className="group relative flex flex-col items-center gap-2">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <span
              aria-hidden="true"
              className="animate-glow-breathe absolute h-16 w-16 rounded-full bg-accent blur-xl transition-opacity duration-300 group-hover:opacity-90"
            />
            <span
              aria-hidden="true"
              className="animate-spin-slow absolute h-16 w-16 rounded-full border border-dashed border-accent/70 transition-colors duration-300 group-hover:border-accent"
            />
            <span
              aria-hidden="true"
              className="animate-spin-slow-reverse absolute h-12 w-12 rounded-full border border-dotted border-accent/40"
            />
            <span aria-hidden="true" className="animate-radar-ping absolute h-3 w-3 rounded-full bg-accent" />

            <span className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-accent bg-surface text-accent shadow-[0_0_24px_-4px_var(--color-accent)] transition-transform duration-300 ease-out group-hover:scale-110 group-active:scale-95">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M9 2.5V15.5M2.5 9H15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
          </div>
          <span className="font-mono text-xs font-bold tracking-[0.2em] text-accent uppercase">
            <span className="text-ink-soft">&gt;</span> 走り書き
          </span>
        </button>

        <div className="flex flex-col items-center gap-2 opacity-40" title="ボイスメモ（Phase 2 で対応予定）">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-line-strong text-ink-soft">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="6" y="1.5" width="4" height="8" rx="2" stroke="currentColor" strokeWidth="1.3" />
              <path d="M3 8a5 5 0 0 0 10 0M8 13v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-mono text-[9.5px] font-semibold tracking-[0.15em] text-ink-soft uppercase">
            ボイスメモ
          </span>
        </div>
      </div>
    </div>
  );
}
