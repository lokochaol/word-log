"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { setBulletLegendVisibleAction } from "@/lib/preferences/actions";
import { BULLET_LEGEND_COOKIE, bulletLegendCookieValue } from "@/lib/preferences/types";

interface PreferencesContextValue {
  /** Whether the Bullet Journal legend appears on the day's task notes. */
  bulletLegendVisible: boolean;
  setBulletLegendVisible: (visible: boolean) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

/**
 * Seeded from the server (root layout reads the cookie and passes it down),
 * so the first paint already matches and the legend never flashes in for
 * someone who turned it off. Toggling updates this context immediately —
 * the Settings switch and the legend itself live on different screens, but
 * both read the same state — then persists the cookie client-side for
 * instant effect with the Server Action as the durable write. Mirrors
 * ThemeProvider.tsx.
 */
export function PreferencesProvider({
  initialBulletLegendVisible,
  children,
}: {
  initialBulletLegendVisible: boolean;
  children: ReactNode;
}) {
  const [bulletLegendVisible, setState] = useState(initialBulletLegendVisible);

  const setBulletLegendVisible = useCallback((visible: boolean) => {
    setState(visible);
    document.cookie = `${BULLET_LEGEND_COOKIE}=${bulletLegendCookieValue(visible)}; path=/; max-age=${
      60 * 60 * 24 * 365
    }; samesite=lax`;
    void setBulletLegendVisibleAction(visible);
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({ bulletLegendVisible, setBulletLegendVisible }),
    [bulletLegendVisible, setBulletLegendVisible],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within a PreferencesProvider");
  return ctx;
}
