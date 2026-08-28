import { cookies } from "next/headers";
import { DEFAULT_THEME, isTheme, THEME_COOKIE, type Theme } from "@/lib/theme/types";

/** Reads the `theme` cookie via Next's async `cookies()` API, defaulting to
 * "dark" when absent/invalid. Server Components only — Client Components
 * read the theme from `useTheme()` instead. Mirrors src/lib/i18n/locale.ts. */
export async function getTheme(): Promise<Theme> {
  const store = await cookies();
  const value = store.get(THEME_COOKIE)?.value;
  return isTheme(value) ? value : DEFAULT_THEME;
}
