"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { setThemeAction } from "@/lib/theme/actions";
import { THEME_COOKIE, type Theme } from "@/lib/theme/types";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Seeded from the server (root layout reads the `theme` cookie and passes
 * `initialTheme` down, also stamping it as `data-theme` on `<html>` so the
 * very first paint already matches — no flash of the wrong theme).
 * `setTheme` updates this context's state immediately, flips `data-theme` on
 * `<html>` directly (so globals.css's `:root[data-theme="light"]` overrides
 * apply without waiting on a re-render), and persists the cookie
 * (client-side document.cookie for instant effect, plus the Server Action
 * as the durable/canonical write). Mirrors LocaleProvider.tsx.
 */
export function ThemeProvider({ initialTheme, children }: { initialTheme: Theme; children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    void setThemeAction(next);
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** `{ theme, setTheme }` — use this instead of reading `data-theme` off the
 * DOM directly so components re-render when the theme changes. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
