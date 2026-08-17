import Link from "next/link";
import * as literatureMemos from "@/lib/literatureMemos";
import { requireSession } from "@/lib/session";
import { LiteratureMemoList } from "@/components/LiteratureMemoList";

export default async function LiteraturePage() {
  const session = await requireSession();
  const ownerSub = session.ownerSub;
  const memos = await literatureMemos.list(ownerSub);

  return (
    <main className="flex min-h-screen flex-col items-center bg-bg px-6 py-16">
      <div className="flex w-full max-w-[720px] flex-col gap-8">
        <div className="flex items-center justify-between">
          <Link
            href="/scratch"
            className="inline-flex w-fit items-center gap-1.5 font-mono text-xs font-medium tracking-wide text-ink-soft transition-colors hover:text-accent"
          >
            <span className="text-accent">&lt;</span> 走り書きへ戻る
          </Link>
          <span className="hidden font-mono text-[10px] text-ink-soft sm:inline">
            {session.user?.email ?? "unknown"}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">文献メモ</h1>
          <p className="font-mono text-xs text-ink-soft">
            走り書き・永久保存版メモから参照されている引用と、その要約の一覧です。全 {memos.length} 件。
          </p>
        </div>

        <LiteratureMemoList initialMemos={memos} />
      </div>
    </main>
  );
}
