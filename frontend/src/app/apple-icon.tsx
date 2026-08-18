import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="115" fill="#050505" />
  <line x1="150" y1="375" x2="380" y2="145" stroke="#ff3d1a" stroke-width="30" stroke-linecap="round" opacity="0.7" />
  <circle cx="150" cy="375" r="48" fill="#ff3d1a" opacity="0.55" />
  <circle cx="380" cy="145" r="66" fill="#ff3d1a" />
</svg>`;

/** Apple touch icon — the "Link" mark (two nodes, one line) that stands in
 * for the app: a Zettelkasten note is only ever worth something once it's
 * linked to another, so the mark is just that connection, nothing else. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <img
        src={`data:image/svg+xml,${encodeURIComponent(ICON_SVG)}`}
        width={size.width}
        height={size.height}
        alt=""
      />
    ),
    { ...size },
  );
}
