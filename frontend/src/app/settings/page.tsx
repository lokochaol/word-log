import Link from "next/link";
import { requireSession } from "@/lib/session";
import { getZoteroSettingsAction } from "@/app/settings/actions";
import { ZoteroSettingsForm } from "@/components/ZoteroSettingsForm";
import { LocaleToggle } from "@/components/LocaleToggle";
import { HeaderMenu } from "@/components/HeaderMenu";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export default async function SettingsPage() {
  const session = await requireSession();
  const zotero = await getZoteroSettingsAction();
  const dict = getDictionary(await getLocale());

  return (
    <main className="flex min-h-screen flex-col items-center bg-bg px-6 py-16">
      <div className="flex w-full max-w-[560px] flex-col gap-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/scratch"
            className="inline-flex w-fit items-center gap-1.5 font-mono text-xs font-medium tracking-wide text-ink-soft transition-colors hover:text-accent"
          >
            <span className="text-accent">&lt;</span> {dict.nav.backToScratch}
          </Link>
          <HeaderMenu>
            <Link
              href="/literature"
              className="font-mono text-[10px] text-ink-soft transition-colors hover:text-accent"
            >
              {dict.nav.literatureLabel}
            </Link>
            <Link href="/guide" className="font-mono text-[10px] text-ink-soft transition-colors hover:text-accent">
              {dict.nav.guideLabel}
            </Link>
            <LocaleToggle />
            <span className="font-mono text-[10px] text-ink-soft">
              {session.user?.email ?? dict.common.unknownEmail}
            </span>
          </HeaderMenu>
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">{dict.settings.heading}</h1>
          <p className="font-mono text-xs text-ink-soft">{dict.settings.description}</p>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-[10.5px] font-semibold tracking-[0.2em] text-ink-soft uppercase">
            <span className="text-accent">{"//"}</span> {dict.settings.zoteroHeading}
          </h2>
          <ZoteroSettingsForm initial={zotero} />
        </section>
      </div>
    </main>
  );
}
