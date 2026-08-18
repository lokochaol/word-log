import Link from "next/link";
import { requireSession } from "@/lib/session";
import { LocaleToggle } from "@/components/LocaleToggle";
import { HeaderMenu } from "@/components/HeaderMenu";
import { GuideContentJa } from "@/components/guide/GuideContentJa";
import { GuideContentEn } from "@/components/guide/GuideContentEn";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export default async function GuidePage() {
  const session = await requireSession();
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <main className="flex min-h-screen flex-col items-center bg-bg px-6 py-16">
      <div className="flex w-full max-w-[760px] flex-col gap-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/scratch"
            className="inline-flex w-fit items-center gap-1.5 font-mono text-xs font-medium tracking-wide text-ink-soft transition-colors hover:text-accent"
          >
            <span className="text-accent">&lt;</span> {dict.nav.backToScratch}
          </Link>
          <HeaderMenu>
            <Link href="/literature" className="font-mono text-[10px] text-ink-soft transition-colors hover:text-accent">
              {dict.nav.literatureLabel}
            </Link>
            <Link href="/settings" className="font-mono text-[10px] text-ink-soft transition-colors hover:text-accent">
              {dict.nav.settingsLabel}
            </Link>
            <LocaleToggle />
            <span className="font-mono text-[10px] text-ink-soft">{session.user?.email ?? dict.common.unknownEmail}</span>
          </HeaderMenu>
        </div>

        {locale === "ja" ? <GuideContentJa /> : <GuideContentEn />}
      </div>
    </main>
  );
}
