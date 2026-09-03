"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import type { ProjectTimelineMark } from "@/lib/projectTaskNotes";

function dayOfMonth(dateKey: string): number {
  return Number(dateKey.slice(-2));
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** ④横向きタイムライン — one horizontal line per active project, scoped to a
 * single calendar month: the track spans day 1 through the month's last
 * day, and the accent segment marks the days the project was actually
 * active (it only ever freezes at a project's explicit close, never a goal
 * deadline — see ProjectCloseButton). Days with a task note get a tappable
 * mark that opens that day's note on the Project detail page. */
export function CalendarTimelineView({
  marks,
  year,
  month,
  todayKey,
  onOpenProjectDay,
}: {
  marks: ProjectTimelineMark[];
  /** The month this timeline is scoped to (1-indexed). */
  year: number;
  month: number;
  todayKey: string;
  /** When provided, tapping a day-mark (or a project's name) calls this
   * instead of navigating to /projects/[id]?date=... — used inline within
   * ZettelkastenScreen so the whole flow stays on that one screen. Omitted,
   * this falls back to a real navigation (the standalone /calendar page's
   * own behavior). */
  onOpenProjectDay?: (projectId: string, dateKey: string) => void;
}) {
  const router = useRouter();
  const { t } = useI18n();

  function openDay(projectId: string, dateKey: string) {
    if (onOpenProjectDay) onOpenProjectDay(projectId, dateKey);
    else router.push(`/projects/${projectId}?date=${dateKey}`);
  }

  if (marks.length === 0) {
    return <p className="py-16 text-center text-sm text-ink-soft">{t.calendar.timelineNoNotes}</p>;
  }

  const totalDays = daysInMonth(year, month);
  const isCurrentMonth = todayKey.slice(0, 7) === `${year}-${String(month).padStart(2, "0")}`;
  const todayLeftPct = isCurrentMonth ? ((dayOfMonth(todayKey) - 0.5) / totalDays) * 100 : null;

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-mono text-[10.5px] font-semibold tracking-[0.2em] text-ink-soft uppercase">
        <span className="text-accent">{"//"}</span> {t.calendar.timelineHeading}
      </h2>
      {marks.map((mark) => {
        const startDay = dayOfMonth(mark.rangeStart);
        const endDay = dayOfMonth(mark.rangeEnd);
        const barLeftPct = ((startDay - 1) / totalDays) * 100;
        const barWidthPct = ((endDay - startDay + 1) / totalDays) * 100;
        return (
          <div key={mark.projectId} className="flex flex-col gap-1.5">
            <button
              onClick={() => openDay(mark.projectId, mark.rangeEnd)}
              className="w-fit font-mono text-[10px] text-ink-soft transition-colors hover:text-accent"
            >
              {mark.projectName}
            </button>
            <div className="relative h-6 w-full rounded-full bg-surface-alt">
              <div
                className="absolute inset-y-0 rounded-full bg-accent/25"
                style={{ left: `${barLeftPct}%`, width: `${barWidthPct}%` }}
              />
              {mark.noteDates.map((dateKey) => {
                const leftPct = ((dayOfMonth(dateKey) - 0.5) / totalDays) * 100;
                return (
                  <button
                    key={dateKey}
                    title={t.calendar.timelineOpenDay(dateKey)}
                    onClick={() => openDay(mark.projectId, dateKey)}
                    style={{ left: `${leftPct}%` }}
                    className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
                  />
                );
              })}
              {todayLeftPct !== null && (
                <div
                  title={t.calendar.timelineTodayLabel}
                  style={{ left: `${todayLeftPct}%` }}
                  className="absolute top-[-4px] bottom-[-4px] w-px -translate-x-1/2 bg-ink-soft"
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
