export type Theme = "dark" | "light";

export const THEME_COOKIE = "theme";
export const DEFAULT_THEME: Theme = "dark";

export function isTheme(value: string | undefined | null): value is Theme {
  return value === "dark" || value === "light";
}
