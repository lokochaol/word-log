import { getDictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/types";

/**
 * The top-left app-name slot. Its text depends on BOTH the current locale
 * AND which of the two main screens it's shown on:
 *   - scratch screen:      ja "走り書き"      / en "Dash Off"
 *   - zettelkasten screen:  ja "ツェッテルカステン" / en "Zettelkasten"
 * This is distinct from the ordinary translated "Scratch"/"Zettelkasten"
 * nav labels used elsewhere (nav.scratchLabel etc. / the ③ column header /
 * the zettelkasten nav pill) — those are regular UI strings, not the brand.
 * /literature, /search, /settings use the scratch variant as the app's
 * "home" brand for consistency.
 */
export function AppBrand({ locale, screen = "scratch" }: { locale: Locale; screen?: "scratch" | "zettelkasten" }) {
  const dict = getDictionary(locale);
  return <>{dict.brand[screen]}</>;
}
