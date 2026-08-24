"use client";

import { useEffect } from "react";

/** Registers public/sw.js once the app has loaded — this is also what
 * primes the offline-shell cache (the worker's install step fetches
 * /offline and the manifest/icons), so a cold, fully-offline launch later
 * has something to fall back to. Mounted once in the root layout. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
