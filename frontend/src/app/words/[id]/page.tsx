import Link from "next/link";
import { notFound } from "next/navigation";
import * as words from "@/lib/words";
import { requireOwnerSub } from "@/lib/session";
import { MeaningBlocksEditor } from "@/components/MeaningBlocksEditor";
import { RelatedWords } from "@/components/RelatedWords";

function formatDate(date: Date) {
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function WordDetailPage(props: PageProps<"/words/[id]">) {
  const { id } = await props.params;
  const ownerSub = await requireOwnerSub();

  let word;
  try {
    word = await words.getDetail(ownerSub, id);
  } catch (e) {
    if (e instanceof words.NotFoundError) notFound();
    throw e;
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-bg px-6 py-16">
      <div className="flex w-full max-w-[720px] flex-col gap-8">
        <Link href="/" className="text-xs font-medium tracking-wide text-ink-soft hover:text-ink">
          ← 一覧へ戻る
        </Link>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-4xl font-extrabold tracking-tight text-ink">{word.text}</h1>
          <p className="font-mono text-xs text-ink-soft">
            出会った日 {formatDate(word.encounteredAt)}　/　最終更新 {formatDate(word.updatedAt)}
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-ink">意味（自分の言葉で）</h2>
          <MeaningBlocksEditor wordId={word.id} blocks={word.meaningBlocks} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-ink">関連語</h2>
          <RelatedWords wordId={word.id} relatedWords={word.relatedWords} />
        </section>
      </div>
    </main>
  );
}
