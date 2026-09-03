"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/LocaleProvider";

/** Prev/next month controls for /calendar's timeline view, wrapping the
 * month label passed as `children` — navigates by replacing the
 * `year`/`month` query params (keeping `view=timeline`), the same
 * URL-driven pattern CalendarViewSwitch uses for the view itself. */
export function CalendarMonthNav({
  year,
  month,
  isCurrentMonth,
  children,
}: {
  year: number;
  month: number;
  isCurrentMonth: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const { t } = useI18n();

  function shiftMonth(delta: number) {
    const base = new Date(Date.UTC(year, month - 1 + delta, 1));
    router.push(`/calendar?view=timeline&year=${base.getUTCFullYear()}&month=${base.getUTCMonth() + 1}`);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => shiftMonth(-1)}
        aria-label={t.calendar.timelinePrevMonth}
        className="flex h-6 w-6 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface-alt hover:text-accent"
      >
        ‹
      </button>
      {children}
      <button
        onClick={() => shiftMonth(1)}
        disabled={isCurrentMonth}
        aria-label={t.calendar.timelineNextMonth}
        className="flex h-6 w-6 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface-alt hover:text-accent disabled:opacity-30 disabled:hover:bg-transparent"
      >
        ›
      </button>
    </div>
  );
}
