import Link from "next/link";
import { requireSession } from "@/lib/session";
import { getZoteroSettingsAction } from "@/app/settings/actions";
import { ZoteroSettingsForm } from "@/components/ZoteroSettingsForm";

export default async function SettingsPage() {
  const session = await requireSession();
  const zotero = await getZoteroSettingsAction();

  return (
    <main className="flex min-h-screen flex-col items-center bg-bg px-6 py-16">
      <div className="flex w-full max-w-[560px] flex-col gap-8">
        <div className="flex items-center justify-between">
          <Link
            href="/scratch"
            className="inline-flex w-fit items-center gap-1.5 font-mono text-xs font-medium tracking-wide text-ink-soft transition-colors hover:text-accent"
          >
            <span className="text-accent">&lt;</span> 走り書きへ戻る
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/literature"
              className="font-mono text-[10px] text-ink-soft transition-colors hover:text-accent"
            >
              文献メモ
            </Link>
            <span className="hidden font-mono text-[10px] text-ink-soft sm:inline">
              {session.user?.email ?? "unknown"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">設定</h1>
          <p className="font-mono text-xs text-ink-soft">
            ここで設定した内容は、あなたのアカウントにのみ適用されます。
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-[10.5px] font-semibold tracking-[0.2em] text-ink-soft uppercase">
            <span className="text-accent">{"//"}</span> Zoteroライブラリ連携
          </h2>
          <ZoteroSettingsForm initial={zotero} />
        </section>
      </div>
    </main>
  );
}
