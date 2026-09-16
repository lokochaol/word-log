"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { usePreferences } from "@/lib/preferences/PreferencesProvider";

/** The signifiers themselves are the notation, not translatable text — only
 * their meanings come from the dictionary. Kept to characters that are one
 * keystroke on any keyboard, since the task note is a plain textarea and
 * these get typed by hand: "." stands in for Bullet Journal's task bullet
 * (•) and "o" for its event circle (○), while "-" is the note dash as-is.
 * Ordered task / its states first, then the other entry kinds, then the two
 * signifiers that prefix any of them. */
const SIGNIFIERS = [".", "x", ">", "<", "o", "-", "*", "!"] as const;

/**
 * A quiet reminder of the Bullet Journal notation, shown wherever a daily
 * project task note is edited — the calendar's day view and the project
 * detail page's day strip, the two places in the app where what gets
 * written is a checklist rather than prose. Collapsed to a single faint
 * line by default and expanded on click, so it stays out of the way of the
 * notes it annotates; it can be turned off entirely in Settings (see
 * PreferencesProvider), in which case it renders nothing at all.
 */
export function BulletJournalLegend() {
  const { t } = useI18n();
  const { bulletLegendVisible } = usePreferences();
  const [expanded, setExpanded] = useState(false);

  if (!bulletLegendVisible) return null;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex items-center gap-1 font-mono text-[9.5px] tracking-wider text-ink-faint uppercase transition-colors hover:text-accent"
      >
        <span aria-hidden="true">{expanded ? "−" : "+"}</span>
        {t.bulletLegend.title}
      </button>

      {expanded && (
        <dl className="flex flex-wrap justify-end gap-x-3 gap-y-1 border-t border-line pt-1.5">
          {SIGNIFIERS.map((key) => (
            <div key={key} className="flex items-baseline gap-1.5">
              <dt className="font-mono text-[11px] text-accent">{key}</dt>
              <dd className="font-mono text-[9.5px] text-ink-soft">{t.bulletLegend.meanings[key]}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
