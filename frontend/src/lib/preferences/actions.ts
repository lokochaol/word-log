"use server";

import { cookies } from "next/headers";
import { BULLET_LEGEND_COOKIE, bulletLegendCookieValue } from "@/lib/preferences/types";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Durable write behind PreferencesProvider's immediate client-side one —
 * same division of labor as setThemeAction. */
export async function setBulletLegendVisibleAction(visible: boolean): Promise<void> {
  const store = await cookies();
  store.set(BULLET_LEGEND_COOKIE, bulletLegendCookieValue(visible), {
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
    sameSite: "lax",
  });
}
