import { cookies } from "next/headers";
import { todayKey as todayKeyIn } from "@/lib/dateKey";
import {
  BULLET_LEGEND_COOKIE,
  DEFAULT_TIME_ZONE,
  TIME_ZONE_COOKIE,
  isBulletLegendVisible,
  isTimeZone,
} from "@/lib/preferences/types";

export async function getTimeZone(): Promise<string> {
  const store = await cookies();
  const value = store.get(TIME_ZONE_COOKIE)?.value;
  return isTimeZone(value) ? value : DEFAULT_TIME_ZONE;
}

/** "Today" as the owner's own calendar sees it, not the server host's.
 * Server Components only — in a Client Component call `todayKey()` from
 * src/lib/dateKey.ts, which reads the browser's zone directly. */
export async function getTodayKey(): Promise<string> {
  return todayKeyIn(await getTimeZone());
}

/** Server Components only — Client Components read this from
 * `usePreferences()` instead. Mirrors src/lib/theme/theme.ts. */
export async function getBulletLegendVisible(): Promise<boolean> {
  const store = await cookies();
  return isBulletLegendVisible(store.get(BULLET_LEGEND_COOKIE)?.value);
}
