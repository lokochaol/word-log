import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n/types";

/** Reads the `locale` cookie via Next's async `cookies()` API, defaulting to
 * "ja" when absent/invalid. Server Components and Server Actions only —
 * Client Components read the locale from `useI18n()` instead. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
