/** Display preferences: per-device, cookie-backed toggles that only affect
 * what's drawn, never any stored data — same shape as the theme and locale
 * cookies (src/lib/theme/types.ts, src/lib/i18n/types.ts) rather than a
 * Prisma model, since there's nothing here worth syncing across devices. */

export const BULLET_LEGEND_COOKIE = "bulletLegend";
export const DEFAULT_BULLET_LEGEND_VISIBLE = true;

export function isBulletLegendVisible(value: string | undefined | null): boolean {
  return value === undefined || value === null || value === "" ? DEFAULT_BULLET_LEGEND_VISIBLE : value === "on";
}

export function bulletLegendCookieValue(visible: boolean): string {
  return visible ? "on" : "off";
}
