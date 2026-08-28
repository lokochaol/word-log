"use server";

import { cookies } from "next/headers";
import { THEME_COOKIE, type Theme } from "@/lib/theme/types";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Persists the chosen theme in a cookie so it survives across routes and
 * full reloads. Called from ThemeToggle; the client-side context updates
 * immediately, this just makes it durable + lets the next Server Component
 * render (root layout's `data-theme` attribute, the PWA theme-color meta
 * tag) pick it up. Mirrors src/lib/i18n/actions.ts. */
export async function setThemeAction(theme: Theme): Promise<void> {
  const store = await cookies();
  store.set(THEME_COOKIE, theme, {
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
    sameSite: "lax",
  });
}
