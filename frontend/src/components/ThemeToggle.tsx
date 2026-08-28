"use client";

import { useTheme } from "@/lib/theme/ThemeProvider";

/** Manual dark/light toggle, styled to match the HUD corner-bracket /
 * monospace / uppercase visual language used across the app (see
 * HudFrame.tsx, globals.css) — mirrors LocaleToggle.tsx's layout so the two
 * sit naturally side by side in a header menu. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center overflow-hidden rounded-full border border-line-strong font-mono text-[10px] tracking-wider uppercase">
      <button
        onClick={() => setTheme("dark")}
        aria-pressed={theme === "dark"}
        aria-label="Dark theme"
        className={`px-2 py-1 transition-colors ${
          theme === "dark" ? "bg-accent-soft text-accent" : "text-ink-soft hover:text-ink"
        }`}
      >
        DARK
      </button>
      <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
      <button
        onClick={() => setTheme("light")}
        aria-pressed={theme === "light"}
        aria-label="Light theme"
        className={`px-2 py-1 transition-colors ${
          theme === "light" ? "bg-accent-soft text-accent" : "text-ink-soft hover:text-ink"
        }`}
      >
        LIGHT
      </button>
    </div>
  );
}
