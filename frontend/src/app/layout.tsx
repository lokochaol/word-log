import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CustomCursor } from "@/components/CustomCursor";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { getLocale } from "@/lib/i18n/locale";

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
    appleWebApp: { title },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg text-ink">
        <LocaleProvider initialLocale={locale}>
          <CustomCursor />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
