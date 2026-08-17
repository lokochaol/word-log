import Link from "next/link";
import type { CSSProperties } from "react";
import * as quickNotes from "@/lib/quickNotes";
import { requireSession } from "@/lib/session";
import { HomeSearchBar } from "@/components/HomeSearchBar";
import { SignOutButton } from "@/components/SignOutButton";
import { AddQuickNoteButton } from "@/components/AddQuickNoteButton";
import { NoteTimeline } from "@/components/NoteTimeline";
import { ZettelkastenNavButton } from "@/components/ZettelkastenNavButton";

function formatDate(date: Date) {
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ScratchPage() {
  const session = await requireSession();
  const ownerSub = session.ownerSub;
  const notes = await quickNotes.listActive(ownerSub);

  return (
    <main className="flex min-h-screen flex-col items-center bg-bg px-6 py-16">
      <div className="flex w-full max-w-[720px] flex-col gap-8">
        <div className="flex items-center justify-between">
          <span className="text-lg font-extrabold tracking-tight text-ink">Word Log</span>
          <div className="flex items-center gap-2">
            <span className="hidden font-mono text-[10px] text-ink-soft sm:inline">
              {session.user?.email ?? "unknown"}
            </span>
            <ZettelkastenNavButton />
            <Link
              href="/literature"
              className="font-mono text-[10px] text-ink-soft transition-colors hover:text-accent"
            >
              文献メモ
            </Link>
            <Link
              href="/settings"
              className="font-mono text-[10px] text-ink-soft transition-colors hover:text-accent"
            >
              設定
            </Link>
            <SignOutButton />
          </div>
        </div>

        <HomeSearchBar />

        <div style={{ viewTransitionName: "note-timeline" } as CSSProperties}>
          <NoteTimeline
            emptyLabel="まだ走り書きがありません。最初の一件を記録しましょう。"
            rows={notes.map((note) => ({
              key: note.id,
              meta: (
                <span className="font-mono text-[10px] tracking-wider text-ink-soft">
                  {formatDate(note.encounteredAt)}
                </span>
              ),
              card: (
                <Link
                  href={`/scratch/${note.id}`}
                  className="group flex w-full max-w-[420px] flex-col gap-2 rounded-lg border border-line bg-surface-alt p-4 text-sm text-ink transition-colors hover:border-accent/60"
                >
                  {note.preview || "(内容未記入)"}
                  {note.literatureCitation && (
                    <span className="flex items-start gap-1.5 border-t border-line pt-2 font-mono text-[10.5px] text-ink-soft">
                      <span className="shrink-0 text-accent">📖</span>
                      <span className="line-clamp-1">{note.literatureCitation}</span>
                    </span>
                  )}
                </Link>
              ),
            }))}
          />

          <AddQuickNoteButton />
        </div>
      </div>
    </main>
  );
}
