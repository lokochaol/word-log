import { ImageResponse } from "next/og";
import { APP_ICON_SVG } from "@/lib/appIcon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — the "Link" mark (two nodes, one line) that stands in
 * for the app: a Zettelkasten note is only ever worth something once it's
 * linked to another, so the mark is just that connection, nothing else. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <img
        src={`data:image/svg+xml,${encodeURIComponent(APP_ICON_SVG)}`}
        width={size.width}
        height={size.height}
        alt=""
      />
    ),
    { ...size },
  );
}
