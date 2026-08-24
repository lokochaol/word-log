import { ImageResponse } from "next/og";
import { APP_ICON_SVG } from "@/lib/appIcon";

const SIZE = 512;

/** See icon-192.png/route.tsx — same reasoning, just the larger size the
 * manifest also lists. */
export function GET() {
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders this itself, next/image doesn't apply
    <img src={`data:image/svg+xml,${encodeURIComponent(APP_ICON_SVG)}`} width={SIZE} height={SIZE} alt="" />,
    { width: SIZE, height: SIZE },
  );
}
