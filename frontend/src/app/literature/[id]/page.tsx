import Link from "next/link";
import { notFound } from "next/navigation";
import * as literatureMemos from "@/lib/literatureMemos";
import { requireOwnerSub } from "@/lib/session";
import { NotFoundError } from "@/lib/errors";
import { LiteratureMemoDetail } from "@/components/LiteratureMemoDetail";

export default async function LiteratureMemoDetailPage(props: PageProps<"/literature/[id]">) {
  const { id } = await props.params;
  const ownerSub = await requireOwnerSub();

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
          <span className="text-accent">&lt;</span> 文献メモへ戻る
        </Link>

        <LiteratureMemoDetail initialDetail={detail} />
      </div>
    </main>
  );
}
