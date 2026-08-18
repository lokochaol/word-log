import Link from "next/link";
import * as quickNotes from "@/lib/quickNotes";
import { requireSession } from "@/lib/session";
import { HomeSearchBar } from "@/components/HomeSearchBar";
import { SignOutButton } from "@/components/SignOutButton";
import { ScratchTimeline } from "@/components/ScratchTimeline";
import { ZettelkastenNavButton } from "@/components/ZettelkastenNavButton";

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

        <ScratchTimeline initialNotes={notes} />
      </div>
    </main>
  );
}
