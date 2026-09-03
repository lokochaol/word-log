"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/LocaleProvider";

/** Simple line-icon glyphs — no emoji, so they read consistently with the
 * rest of the HUD's monochrome/mono-label visual language across themes
 * (currentColor picks up the button's own text color). */
function ProjectsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="3" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.5 6.5H14.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.5 1.5V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11.5 1.5V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * A fixed, always-visible icon-button strip along the very left edge of the
 * zettelkasten screen's pane area — not a HeaderMenu entry (which is a
 * collapsed, tap-to-open overflow list). Sits outside the col①/②/③ grid so
 * it doesn't animate/resize with editorOpen. Dash Off intentionally has no
 * equivalent bar — Projects/Calendar are reached from here only.
 */
export function ZettelkastenSideActionBar() {
  const { t } = useI18n();
  return (
    <div className="flex w-11 shrink-0 flex-col items-center gap-2 border-r border-line py-3">
      <Link
        href="/projects"
        title={t.nav.projectsLabel}
        aria-label={t.nav.projectsLabel}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-surface-alt hover:text-accent"
      >
        <ProjectsIcon />
      </Link>
      <Link
        href="/calendar"
        title={t.nav.calendarLabel}
        aria-label={t.nav.calendarLabel}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-surface-alt hover:text-accent"
      >
        <CalendarIcon />
      </Link>
    </div>
  );
}
