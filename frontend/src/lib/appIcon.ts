/** The "Link" mark (two nodes, one line) that stands in for the app: a
 * Zettelkasten note is only ever worth something once it's linked to
 * another, so the mark is just that connection, nothing else. Shared by
 * apple-icon.tsx and the manifest's PNG icon routes so all three stay in
 * sync. */
/**
 * Cache headers for the ImageResponse-rendered icons (apple-icon, and the
 * manifest's two PNG routes).
 *
 * ImageResponse defaults to `public, immutable, max-age=31536000` — a year,
 * declared immutable, at a URL that never changes. That's right for an OG
 * image whose URL carries its content, and wrong here: changing the mark
 * left every browser and CDN that had already fetched `/icon-192.png`
 * serving the old one indefinitely, which is why an icon change could show
 * up in the tab (icon.svg, a plain static file) while the install prompt
 * kept the previous one. A day of caching with revalidation keeps the icon
 * free while still letting it change.
 */
export const APP_ICON_CACHE_HEADERS = {
  "cache-control": "public, max-age=86400, must-revalidate",
};

export const APP_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="115" fill="#f3f4f7" />
  <line x1="150" y1="375" x2="380" y2="145" stroke="#ff3d1a" stroke-width="30" stroke-linecap="round" opacity="0.8" />
  <circle cx="150" cy="375" r="48" fill="#ff3d1a" opacity="0.7" />
  <circle cx="380" cy="145" r="66" fill="#ff3d1a" />
</svg>`;
