"use client";

import { useRouter } from "next/navigation";
import { navigateWithViewTransition } from "@/lib/viewTransition";

/** The always-visible nav action on 走り書き that fires the /scratch → /zettelkasten transition (§5) — never automatic/implicit. */
export function ZettelkastenNavButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => navigateWithViewTransition(router, "/zettelkasten")}
      className="rounded-full border border-line-strong px-3 py-1.5 font-mono text-[10.5px] text-ink-soft transition-colors hover:border-accent hover:text-accent"
    >
      ツェッテルカステンへ <span className="text-accent">→</span>
    </button>
  );
}
