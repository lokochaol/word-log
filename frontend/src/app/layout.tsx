import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CustomCursor } from "@/components/CustomCursor";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { getLocale } from "@/lib/i18n/locale";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { getTheme } from "@/lib/theme/theme";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/** The home-screen/browser-tab title is fixed to the Zettelkasten name
 * (not the per-screen "Dash Off"/"走り書き" brand used inside the app) since
 * it's captured once, independent of whichever screen is open at the time. */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title = locale === "ja" ? "ツェッテルカステン" : "Zettelkasten";
  const description =
    locale === "ja"
      ? "書き留めた考えをリンクでつなぎ、育てていく個人的な知識システム。"
      : "A personal knowledge system where your notes grow by linking to one another.";
  return {
    title,
    description,
    manifest: "/manifest.webmanifest",
    appleWebApp: { title },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const theme = await getTheme();
  return { themeColor: theme === "light" ? "#f3f4f7" : "#050505" };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const theme = await getTheme();
  return (
    <html lang={locale} data-theme={theme} className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg text-ink">
        <ThemeProvider initialTheme={theme}>
          <LocaleProvider initialLocale={locale}>
            <CustomCursor />
            <ServiceWorkerRegister />
            {children}
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
