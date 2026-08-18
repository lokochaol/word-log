"use client";

import { useTransition } from "react";
import { createLiteratureMemoAction } from "@/app/literature/actions";
import type { LiteratureMemoDetail } from "@/lib/literatureMemos";
import { useI18n } from "@/lib/i18n/LocaleProvider";

/**
 * Same ring/glow HUD "+" treatment as AddQuickNoteButton — creates a blank
 * LiteratureMemo (not linked to any note yet) and hands the caller the full
 * detail so it can navigate into it (the /literature page) or open it inline
 * (ZettelkastenScreen's pane). This is the "add it on its own, flesh it out
 * later" path, mirroring how 走り書き gets added.
 */
export function AddLiteratureMemoButton({ onCreated }: { onCreated: (memo: LiteratureMemoDetail) => void }) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();

  function create() {
    startTransition(async () => {
      const memo = await createLiteratureMemoAction();
      onCreated(memo);
    });
  }

  return (
    <div className="flex flex-col items-center gap-3 pt-10 pb-4">
      <button onClick={create} disabled={pending} className="group relative flex flex-col items-center gap-2">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <span
            aria-hidden="true"
            className="animate-glow-breathe absolute h-14 w-14 rounded-full bg-accent blur-xl transition-opacity duration-300 group-hover:opacity-90"
          />
          <span
            aria-hidden="true"
            className="animate-spin-slow absolute h-14 w-14 rounded-full border border-dashed border-accent/70 transition-colors duration-300 group-hover:border-accent"
          />
          <span aria-hidden="true" className="animate-radar-ping absolute h-3 w-3 rounded-full bg-accent" />

          <span className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent bg-surface text-accent shadow-[0_0_24px_-4px_var(--color-accent)] transition-transform duration-300 ease-out group-hover:scale-110 group-active:scale-95">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M9 2.5V15.5M2.5 9H15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        </div>
        <span className="font-mono text-xs font-bold tracking-[0.2em] text-accent uppercase">
          <span className="text-ink-soft">&gt;</span> {t.literature.addButton}
        </span>
      </button>
    </div>
  );
}
