import { cookies } from "next/headers";
import { BULLET_LEGEND_COOKIE, isBulletLegendVisible } from "@/lib/preferences/types";

/** Server Components only — Client Components read this from
 * `usePreferences()` instead. Mirrors src/lib/theme/theme.ts. */
export async function getBulletLegendVisible(): Promise<boolean> {
  const store = await cookies();
  return isBulletLegendVisible(store.get(BULLET_LEGEND_COOKIE)?.value);
}
