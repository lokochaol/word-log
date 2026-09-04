import type { ReactNode } from "react";

const CORNER_BASE = "absolute h-3 w-3 border-accent transition-all duration-300 ease-out";

function HudCorners({ active }: { active: boolean }) {
  return (
    <>
      <span
        aria-hidden="true"
        className={`${CORNER_BASE} top-0 left-0 border-t-2 border-l-2 ${
          active ? "-translate-x-1 -translate-y-1 opacity-100" : "translate-x-0.5 translate-y-0.5 opacity-0"
        }`}
      />
      <span
        aria-hidden="true"
        className={`${CORNER_BASE} top-0 right-0 border-t-2 border-r-2 ${
          active ? "translate-x-1 -translate-y-1 opacity-100" : "-translate-x-0.5 translate-y-0.5 opacity-0"
        }`}
      />
      <span
        aria-hidden="true"
        className={`${CORNER_BASE} bottom-0 left-0 border-b-2 border-l-2 ${
          active ? "-translate-x-1 translate-y-1 opacity-100" : "translate-x-0.5 -translate-y-0.5 opacity-0"
        }`}
      />
      <span
        aria-hidden="true"
        className={`${CORNER_BASE} right-0 bottom-0 border-r-2 border-b-2 ${
          active ? "translate-x-1 translate-y-1 opacity-100" : "-translate-x-0.5 -translate-y-0.5 opacity-0"
        }`}
      />
    </>
  );
}

export function HudFrame({
  active,
  children,
  innerClassName = "flex items-center gap-3 rounded-xl px-5 py-4 text-sm",
  scanline = true,
}: {
  active: boolean;
  children: ReactNode;
  innerClassName?: string;
  /** The animated sweep reads fine on a glanced-at button/badge, but is
   * distracting on content meant to be read or edited for a while (e.g. a
   * card wrapping a text editor) — pass false to drop it there. */
  scanline?: boolean;
}) {
  return (
    <div className="relative px-1.5 py-1.5">
      <HudCorners active={active} />
      <div
        className={`relative border bg-surface transition-all duration-300 ${scanline ? "hud-scanline" : ""} ${innerClassName} ${
          active
            ? "border-accent shadow-[0_0_0_4px_var(--color-accent-soft),0_0_28px_-6px_var(--color-accent)]"
            : "border-line shadow-none"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
