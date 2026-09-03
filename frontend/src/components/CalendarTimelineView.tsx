"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import type { ProjectTimelineMark } from "@/lib/projectTaskNotes";

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / (24 * 60 * 60 * 1000));
}

function dateKeyOf(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** ④横向きタイムライン — one horizontal line per active project, spanning
 * from its start date to today (the bar always extends to "now" while a
 * project stays open — it only ever freezes if the project is explicitly
 * closed via ProjectCloseButton, never from a goal deadline). Days with a
 * task note get a tappable mark that opens that day's note on the Project
 * detail page. */
export function CalendarTimelineView({ marks, todayKey }: { marks: ProjectTimelineMark[]; todayKey: string }) {
  const router = useRouter();
  const { t } = useI18n();

  if (marks.length === 0) {
    return <p className="py-16 text-center text-sm text-ink-soft">{t.calendar.timelineNoNotes}</p>;
  }

  const maxSpan = Math.max(1, ...marks.map((m) => daysBetween(dateKeyOf(m.startedAt), todayKey)));

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-mono text-[10.5px] font-semibold tracking-[0.2em] text-ink-soft uppercase">
        <span className="text-accent">{"//"}</span> {t.calendar.timelineHeading}
      </h2>
      {marks.map((mark) => {
        const startKey = dateKeyOf(mark.startedAt);
        const span = Math.max(1, daysBetween(startKey, todayKey));
        const widthPct = (span / maxSpan) * 100;
        return (
          <div key={mark.projectId} className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] text-ink-soft">{mark.projectName}</span>
            <div className="relative h-6 w-full rounded-full bg-surface-alt">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-accent/25"
                style={{ width: `${widthPct}%` }}
              />
              {mark.noteDates.map((dateKey) => {
                const offset = daysBetween(startKey, dateKey);
                const leftPct = span === 0 ? 0 : (offset / span) * widthPct;
                return (
                  <button
                    key={dateKey}
                    title={t.calendar.timelineOpenDay(dateKey)}
                    onClick={() => router.push(`/projects/${mark.projectId}?date=${dateKey}`)}
                    style={{ left: `${leftPct}%` }}
                    className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
                  />
                );
              })}
              <div
                title={t.calendar.timelineTodayLabel}
                style={{ left: `${widthPct}%` }}
                className="absolute top-[-4px] bottom-[-4px] w-px -translate-x-1/2 bg-ink-soft"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
