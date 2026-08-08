import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { MeaningEditor } from "@/components/MeaningEditor";
import { RelatedWords } from "@/components/RelatedWords";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function WordDetailPage(props: PageProps<"/words/[id]">) {
  const { id } = await props.params;

  let word;
  try {
    word = await api.getWord(id);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
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
          <MeaningEditor wordId={word.id} meaning={word.meaning} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-ink">関連語</h2>
          <RelatedWords wordId={word.id} relatedWords={word.relatedWords} />
        </section>
      </div>
    </main>
  );
}
