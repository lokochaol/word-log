import { ja } from "@/lib/i18n/dictionaries/ja";
import { en } from "@/lib/i18n/dictionaries/en";
import type { Dictionary, Locale } from "@/lib/i18n/types";

const DICTIONARIES: Record<Locale, Dictionary> = { ja, en };

/**
 * Pure function — works identically in Server Components, Server Actions,
 * and Client Components, so it never requires the client-side context to be
 * present. `LocaleProvider`'s `useI18n().t` is a thin wrapper around this,
 * kept only so client components can react to a runtime locale change
 * without a full reload.
 */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/** Locale-aware date formatting shared by every component that formats a
 * Date for display (mirrors `toLocaleDateString`/`toLocaleString`'s intl tag). */
export function localeTag(locale: Locale): string {
  return locale === "ja" ? "ja-JP" : "en-US";
}
