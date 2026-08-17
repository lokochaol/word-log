import Link from "next/link";
import { notFound } from "next/navigation";
import * as quickNotes from "@/lib/quickNotes";
import { requireOwnerSub } from "@/lib/session";
import { NotFoundError } from "@/lib/errors";
import { QuickNoteBlocksSection } from "@/components/QuickNoteBlocksSection";
import { QuickNoteLiteratureSection } from "@/components/QuickNoteLiteratureSection";

function formatDate(date: Date) {
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function QuickNoteDetailPage(props: PageProps<"/scratch/[id]">) {
  const { id } = await props.params;
  const ownerSub = await requireOwnerSub();

  let note;
  try {
    note = await quickNotes.getDetail(ownerSub, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-bg px-6 py-16">
      <div className="flex w-full max-w-[720px] flex-col gap-8">
        <Link
          href="/scratch"
          className="inline-flex w-fit items-center gap-1.5 font-mono text-xs font-medium tracking-wide text-ink-soft transition-colors hover:text-accent"
        >
          <span className="text-accent">&lt;</span> 走り書きへ戻る
        </Link>

        <div className="flex flex-col gap-1.5">
          <p className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">
            {note.source === "VOICE" ? "ボイスメモ" : "走り書き"}
            {note.status === "ARCHIVED" && <span className="ml-2 text-ink-soft">（昇格済み）</span>}
          </p>
          <p className="font-mono text-xs text-ink-soft">
            出会った日 {formatDate(note.encounteredAt)}　/　最終更新 {formatDate(note.updatedAt)}
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-[10.5px] font-semibold tracking-[0.2em] text-ink-soft uppercase">
            <span className="text-accent">{"//"}</span> 内容
          </h2>
          <QuickNoteBlocksSection noteId={note.id} blocks={note.blocks} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-[10.5px] font-semibold tracking-[0.2em] text-ink-soft uppercase">
            <span className="text-accent">{"//"}</span> 文献メモ（任意）
          </h2>
          <QuickNoteLiteratureSection noteId={note.id} literatureMemo={note.literatureMemo} />
        </section>
      </div>
    </main>
  );
}
