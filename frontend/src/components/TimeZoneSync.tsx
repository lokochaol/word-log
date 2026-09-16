"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TIME_ZONE_COOKIE } from "@/lib/preferences/types";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Tells the server which calendar the owner is actually on. A Server
 * Component has no way to know — it only has the host's clock, which on
 * Vercel is UTC — so "today" was computed a day behind for anyone in JST
 * for the first nine hours of every day. This mirrors the browser's IANA
 * zone into a cookie that src/lib/preferences/preferences.ts#getTodayKey
 * reads.
 *
 * It refreshes exactly once per change: the server passes back whatever it
 * currently believes, and a refresh only happens when the browser disagrees
 * with it — after which they agree and nothing further fires. Renders
 * nothing. Mounted in the root layout so it covers every route.
 */
export function TimeZoneSync({ serverTimeZone }: { serverTimeZone: string }) {
  const router = useRouter();

  useEffect(() => {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!browserTimeZone || browserTimeZone === serverTimeZone) return;
    document.cookie = `${TIME_ZONE_COOKIE}=${encodeURIComponent(
      browserTimeZone,
    )}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
    router.refresh();
  }, [serverTimeZone, router]);

  return null;
}
