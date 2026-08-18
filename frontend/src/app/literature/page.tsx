import Link from "next/link";
import * as literatureMemos from "@/lib/literatureMemos";
import { requireSession } from "@/lib/session";
import { LiteratureMemoList } from "@/components/LiteratureMemoList";
import { LocaleToggle } from "@/components/LocaleToggle";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export default async function LiteraturePage() {
  const session = await requireSession();
  const ownerSub = session.ownerSub;
  const memos = await literatureMemos.list(ownerSub);
  const dict = getDictionary(await getLocale());

  return (
    <main className="flex min-h-screen flex-col items-center bg-bg px-6 py-16">
      <div className="flex w-full max-w-[720px] flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <Link
            href="/scratch"
            className="inline-flex w-fit items-center gap-1.5 font-mono text-xs font-medium tracking-wide text-ink-soft transition-colors hover:text-accent"
          >
            <span className="text-accent">&lt;</span> {dict.nav.backToScratch}
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <LocaleToggle />
            <span className="hidden font-mono text-[10px] text-ink-soft sm:inline">
              {session.user?.email ?? dict.common.unknownEmail}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">{dict.literature.heading}</h1>
          <p className="font-mono text-xs text-ink-soft">{dict.literature.description(memos.length)}</p>
        </div>

        <LiteratureMemoList initialMemos={memos} />
      </div>
    </main>
  );
}
