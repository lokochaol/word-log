"use client";

import { useI18n } from "@/lib/i18n/LocaleProvider";

/** Manual JA/EN toggle, styled to match the HUD corner-bracket / monospace /
 * uppercase visual language used across the app's nav pills and buttons
 * (see HudFrame.tsx, globals.css). Placed in the header next to sign-out /
 * settings links on every main screen. */
export function LocaleToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center overflow-hidden rounded-full border border-line-strong font-mono text-[10px] tracking-wider uppercase">
      <button
        onClick={() => setLocale("ja")}
        aria-pressed={locale === "ja"}
        className={`px-2 py-1 transition-colors ${
          locale === "ja" ? "bg-accent-soft text-accent" : "text-ink-soft hover:text-ink"
        }`}
      >
        JA
      </button>
      <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
      <button
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={`px-2 py-1 transition-colors ${
          locale === "en" ? "bg-accent-soft text-accent" : "text-ink-soft hover:text-ink"
        }`}
      >
        EN
      </button>
    </div>
  );
}
