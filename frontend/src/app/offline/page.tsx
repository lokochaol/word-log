import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

/** Precached by public/sw.js at install time and served straight from the
 * cache when a navigation fails while offline — this is what a cold app
 * launch (no tab already open, e.g. from the home-screen icon) shows
 * instead of the browser's own offline error page. Deliberately has no
 * session/DB dependency, so it renders the same whether or not the visitor
 * was ever signed in. */
export default async function OfflinePage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 py-6 text-center">
      <span className="text-3xl text-accent">⚠</span>
      <p className="max-w-xs font-mono text-sm text-ink">{t.common.offlinePageMessage}</p>
    </main>
  );
}
