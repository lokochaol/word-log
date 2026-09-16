/** Display preferences: per-device, cookie-backed toggles that only affect
 * what's drawn, never any stored data — same shape as the theme and locale
 * cookies (src/lib/theme/types.ts, src/lib/i18n/types.ts) rather than a
 * Prisma model, since there's nothing here worth syncing across devices. */

/** The browser's IANA time zone, mirrored into a cookie by TimeZoneSync so
 * Server Components can work out the owner's "today" instead of the
 * host's — see src/lib/dateKey.ts. UTC until the first client render has
 * had a chance to write it. */
export const TIME_ZONE_COOKIE = "tz";
export const DEFAULT_TIME_ZONE = "UTC";

export function isTimeZone(value: string | undefined | null): value is string {
  if (!value) return false;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export const BULLET_LEGEND_COOKIE = "bulletLegend";
export const DEFAULT_BULLET_LEGEND_VISIBLE = true;

export function isBulletLegendVisible(value: string | undefined | null): boolean {
  return value === undefined || value === null || value === "" ? DEFAULT_BULLET_LEGEND_VISIBLE : value === "on";
}

export function bulletLegendCookieValue(visible: boolean): string {
  return visible ? "on" : "off";
}
