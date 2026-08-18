import Link from "next/link";
import { notFound } from "next/navigation";
import * as literatureMemos from "@/lib/literatureMemos";
import { requireOwnerSub } from "@/lib/session";
import { NotFoundError } from "@/lib/errors";
import { LiteratureMemoDetail } from "@/components/LiteratureMemoDetail";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export default async function LiteratureMemoDetailPage(props: PageProps<"/literature/[id]">) {
  const { id } = await props.params;
  const ownerSub = await requireOwnerSub();
  const dict = getDictionary(await getLocale());

  let detail;
  try {
    detail = await literatureMemos.getDetail(ownerSub, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-bg px-6 py-16">
      <div className="flex w-full max-w-[720px] flex-col gap-8">
        <Link
          href="/literature"
          className="inline-flex w-fit items-center gap-1.5 font-mono text-xs font-medium tracking-wide text-ink-soft transition-colors hover:text-accent"
        >
          <span className="text-accent">&lt;</span> {dict.nav.backToLiterature}
        </Link>

        <LiteratureMemoDetail initialDetail={detail} />
      </div>
    </main>
  );
}
