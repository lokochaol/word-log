/** Absolute origin of this deployment, for the places that can't use a
 * relative URL: robots.txt's Sitemap line and sitemap.xml's <loc> entries
 * both require fully-qualified URLs.
 *
 * VERCEL_PROJECT_PRODUCTION_URL is the project's stable production host
 * (word-log-two.vercel.app), which is what a sitemap should name — unlike
 * VERCEL_URL, which is the per-deployment hostname and would point search
 * engines at a specific immutable build. */
export function siteUrl(): string {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return host ? `https://${host}` : "http://localhost:3000";
}
