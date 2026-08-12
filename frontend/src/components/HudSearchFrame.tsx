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

export function HudSearchFrame({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div className="relative px-1.5 py-1.5">
      <HudCorners active={active} />
      <div
        className={`hud-scanline relative flex items-center gap-3 rounded-xl border bg-surface px-5 py-4 text-sm transition-all duration-300 ${
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
