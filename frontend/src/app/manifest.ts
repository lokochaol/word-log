import type { MetadataRoute } from "next";

/** Makes the app installable (Add to Home Screen / desktop install) and,
 * together with public/sw.js + ServiceWorkerRegister, is what lets it be
 * opened cold with zero connectivity — experimental.useOffline (see
 * next.config.ts) only covers a tab that was already open when it went
 * offline, this covers launching it from a home-screen icon or bookmark
 * while offline the whole time. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zettelkasten",
    short_name: "Zettelkasten",
    description: "書き留めた考えをリンクでつなぎ、育てていく個人的な知識システム。",
    start_url: "/scratch",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
