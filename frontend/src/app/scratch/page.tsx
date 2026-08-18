import Link from "next/link";
import * as quickNotes from "@/lib/quickNotes";
import { requireSession } from "@/lib/session";
import { HomeSearchBar } from "@/components/HomeSearchBar";
import { SignOutButton } from "@/components/SignOutButton";
import { ScratchTimeline } from "@/components/ScratchTimeline";
import { ZettelkastenNavButton } from "@/components/ZettelkastenNavButton";
import { AppBrand } from "@/components/AppBrand";
import { LocaleToggle } from "@/components/LocaleToggle";
import { HeaderMenu } from "@/components/HeaderMenu";
import { HeaderAccountBadge } from "@/components/HeaderAccountBadge";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export default async function ScratchPage() {
  const session = await requireSession();
  const ownerSub = session.ownerSub;
  const notes = await quickNotes.listActive(ownerSub);
  const locale = await getLocale();
  const dict = getDictionary(locale);

  const header = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-lg font-extrabold tracking-tight text-ink">
          <AppBrand locale={locale} screen="scratch" />
        </span>
        <div className="flex items-center gap-2">
          <ZettelkastenNavButton />
          <HeaderMenu>
            <div className="flex w-full flex-col items-end gap-1.5 border-b border-line pb-2.5">
              <HeaderAccountBadge email={session.user?.email ?? dict.common.unknownEmail} />
              <Link href="/settings" className="font-mono text-[10px] text-ink-soft transition-colors hover:text-accent">
                {dict.nav.settingsLabel}
              </Link>
            </div>
            <Link href="/literature" className="font-mono text-[10px] text-ink-soft transition-colors hover:text-accent">
              {dict.nav.literatureLabel}
            </Link>
            <Link href="/guide" className="font-mono text-[10px] text-ink-soft transition-colors hover:text-accent">
              {dict.nav.guideLabel}
            </Link>
            <LocaleToggle />
            <SignOutButton />
          </HeaderMenu>
        </div>
      </div>

      <HomeSearchBar />
    </>
  );

  return (
    <main className="flex h-dvh flex-col items-center overflow-hidden bg-bg px-6 py-6">
      <div className="flex h-full w-full max-w-[720px] min-h-0 flex-col">
        <ScratchTimeline initialNotes={notes} header={header} />
      </div>
    </main>
  );
}
