import { ImageResponse } from "next/og";
import { APP_ICON_SVG } from "@/lib/appIcon";

const SIZE = 192;

/** Not a Next icon-file-convention route (those only recognize `icon`/
 * `apple-icon`) — a plain route handler under a literal `icon-192.png`
 * segment, so manifest.ts has a stable `/icon-192.png` URL to point at for
 * the PWA install/home-screen icon. */
export function GET() {
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders this itself, next/image doesn't apply
    <img src={`data:image/svg+xml,${encodeURIComponent(APP_ICON_SVG)}`} width={SIZE} height={SIZE} alt="" />,
    { width: SIZE, height: SIZE },
  );
}
