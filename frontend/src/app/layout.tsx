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

export const metadata: Metadata = {
  title: "Word Log",
  description: "出会った単語を記録する個人辞書 / A personal dictionary for the words you encounter",
};

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
