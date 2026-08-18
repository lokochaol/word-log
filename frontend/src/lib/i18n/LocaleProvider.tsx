"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionary";
import { setLocaleAction } from "@/lib/i18n/actions";
import { LOCALE_COOKIE, type Dictionary, type Locale } from "@/lib/i18n/types";

interface I18nContextValue {
  locale: Locale;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Seeded from the server (root layout reads the `locale` cookie and passes
 * `initialLocale` down) so the very first paint already matches the cookie —
 * no flash of the wrong language. `setLocale` updates this context's state
 * immediately (so every Client Component re-renders in the new language
 * right away) *and* persists the cookie (client-side document.cookie, for
 * instant effect, plus the Server Action as the durable/canonical write) and
 * calls `router.refresh()` so Server Components re-render with the new
 * `getLocale()` result too.
 */
export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      void setLocaleAction(next);
      router.refresh();
    },
    [router],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, t: getDictionary(locale), setLocale }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** `{ locale, t, setLocale }` — `t` is the current-language dictionary (not
 * a function): `t.common.save`, `t.zettelkasten.countAll(5)`, etc. */
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within a LocaleProvider");
  return ctx;
}
