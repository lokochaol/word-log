"use client";

import { useI18n } from "@/lib/i18n/LocaleProvider";

/** The "+ 走り書き" ring/glow button. Purely a trigger — clicking it just
 * asks the caller to open another PendingQuickNoteCard; it carries no state
 * of its own so it stays clickable while any number of drafts are still
 * saving. */
export function AddQuickNoteTrigger({ onClick }: { onClick: () => void }) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center gap-3 pt-14 pb-4">
      <button onClick={onClick} className="group relative flex flex-col items-center gap-2">
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
          <span className="text-ink-soft">&gt;</span> {t.scratch.addButton}
        </span>
      </button>
    </div>
  );
}
