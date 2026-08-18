"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/types";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Persists the chosen locale in a cookie (not a query param) so it survives
 * across routes and full reloads. Called from LocaleToggle; the client-side
 * context updates immediately, this just makes it durable + lets the next
 * Server Component render pick it up. */
export async function setLocaleAction(locale: Locale): Promise<void> {
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
    sameSite: "lax",
  });
}
