"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n/LocaleProvider";

export type ZettelkastenMainView = "notes" | "projects" | "calendar";

/** Simple line-icon glyphs — no emoji, so they read consistently with the
 * rest of the HUD's monochrome/mono-label visual language across themes
 * (currentColor picks up the button's own text color). */
function NotesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3.2" y="1.5" width="9" height="11" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.2 4.5H10.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5.2 7H10.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5.2 9.5H8.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

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

function ActionBarButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-transparent text-ink-soft hover:bg-surface-alt hover:text-accent"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * A fixed, always-visible icon-button strip along the very left edge of the
 * zettelkasten screen's pane area — not a HeaderMenu entry (which is a
 * collapsed, tap-to-open overflow list) and not a real navigation either:
 * picking an icon swaps which content the pane area shows (③本来のノート／
 * プロジェクト／カレンダー) in place, without leaving this screen, and the
 * active icon stays highlighted so the current view is always visible at a
 * glance. "notes" (①②③のツェッテルカステン本体) is included here too so
 * there's always a way back to it once you've switched away.
 */
export function ZettelkastenSideActionBar({
  active,
  onSelect,
}: {
  active: ZettelkastenMainView;
  onSelect: (view: ZettelkastenMainView) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex w-11 shrink-0 flex-col items-center gap-2 border-r border-line py-3">
      <ActionBarButton active={active === "notes"} label={t.brand.zettelkasten} onClick={() => onSelect("notes")}>
        <NotesIcon />
      </ActionBarButton>
      <ActionBarButton active={active === "projects"} label={t.nav.projectsLabel} onClick={() => onSelect("projects")}>
        <ProjectsIcon />
      </ActionBarButton>
      <ActionBarButton active={active === "calendar"} label={t.nav.calendarLabel} onClick={() => onSelect("calendar")}>
        <CalendarIcon />
      </ActionBarButton>
    </div>
  );
}
