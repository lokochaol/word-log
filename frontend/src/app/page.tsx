import Link from "next/link";
import * as words from "@/lib/words";
import { requireOwnerSub } from "@/lib/session";
import { HomeSearchBar } from "@/components/HomeSearchBar";
import { SignOutButton } from "@/components/SignOutButton";
import { WordGraphBackground } from "@/components/WordGraphBackground";
import { AddWordButton } from "@/components/AddWordButton";

function formatDate(date: Date) {
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function HomePage() {
  const ownerSub = await requireOwnerSub();
  const [wordList, graph] = await Promise.all([
    words.listChronological(ownerSub),
    words.getWordGraph(ownerSub),
  ]);

  return (
    <main className="relative flex min-h-screen flex-col items-center bg-bg px-6 py-16">
      <WordGraphBackground graph={graph} />
      <div className="relative flex w-full max-w-[720px] flex-col gap-8">
        <div className="flex items-center justify-between">
          <span className="text-lg font-extrabold tracking-tight text-ink">Word Log</span>
          <SignOutButton />
        </div>

        <HomeSearchBar />

        <div className="relative flex flex-col items-center">
          {wordList.length > 0 && (
            <div
              aria-hidden="true"
              className="absolute top-9 bottom-24 left-1/2 w-px -translate-x-1/2 bg-line-strong"
            />
          )}

          {wordList.length === 0 && (
            <p className="py-16 text-center text-sm text-ink-soft">
              まだ単語がありません。最初の出会いを記録しましょう。
            </p>
          )}

          {wordList.map((word) => (
            <Link
              key={word.id}
              href={`/words/${word.id}`}
              className="group relative flex w-full flex-col items-center gap-2 py-8"
            >
              <span className="h-2 w-2 rounded-full bg-ink transition-transform duration-200 group-hover:scale-150 group-hover:bg-accent" />
              <span className="font-mono text-[10px] tracking-wider text-ink-soft">
                {formatDate(word.encounteredAt)}
              </span>
              <span className="text-2xl font-extrabold tracking-tight text-ink transition-colors duration-200 group-hover:text-accent">
                {word.text}
              </span>
            </Link>
          ))}

          <AddWordButton />
        </div>
      </div>
    </main>
  );
}
