"use client";

import { useI18n } from "@/lib/i18n/LocaleProvider";
import { usePreferences } from "@/lib/preferences/PreferencesProvider";

/** Settings switch for the Bullet Journal legend on the day's task notes —
 * styled after ThemeToggle/LocaleToggle, the app's other two-state
 * preference pills. */
export function BulletLegendToggle() {
  const { t } = useI18n();
  const { bulletLegendVisible, setBulletLegendVisible } = usePreferences();

  return (
    <div className="flex items-center overflow-hidden rounded-full border border-line-strong font-mono text-[10px] tracking-wider uppercase">
      <button
        onClick={() => setBulletLegendVisible(true)}
        aria-pressed={bulletLegendVisible}
        className={`px-2.5 py-1 transition-colors ${
          bulletLegendVisible ? "bg-accent-soft text-accent" : "text-ink-soft hover:text-ink"
        }`}
      >
        {t.settings.bulletLegendShow}
      </button>
      <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
      <button
        onClick={() => setBulletLegendVisible(false)}
        aria-pressed={!bulletLegendVisible}
        className={`px-2.5 py-1 transition-colors ${
          !bulletLegendVisible ? "bg-accent-soft text-accent" : "text-ink-soft hover:text-ink"
        }`}
      >
        {t.settings.bulletLegendHide}
      </button>
    </div>
  );
}
