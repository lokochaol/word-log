import Link from "next/link";
import { SearchClient } from "@/components/SearchClient";

export default async function SearchPage(props: PageProps<"/search">) {
  const params = await props.searchParams;
  const q = typeof params.q === "string" ? params.q : "";

  return (
    <main className="flex min-h-screen flex-col items-center bg-bg px-6 py-16">
      <div className="flex w-full max-w-[680px] flex-col gap-6">
        <Link href="/" className="text-xs font-medium tracking-wide text-ink-soft hover:text-ink">
          ← 一覧へ戻る
        </Link>
        <SearchClient initialQuery={q} />
      </div>
    </main>
  );
}
