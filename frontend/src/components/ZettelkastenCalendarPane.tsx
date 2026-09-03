"use client";

import { useEffect, useState } from "react";
import { LoadingBlock } from "@/components/LoadingSpinner";
import { CalendarTodayView } from "@/components/CalendarTodayView";
import { CalendarTimelineView } from "@/components/CalendarTimelineView";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { localeTag } from "@/lib/i18n/dictionary";
import { listTodayProjectNotesAction, listTimelineMarksAction } from "@/app/calendar/actions";
import type { TodayProjectNote, ProjectTimelineMark } from "@/lib/projectTaskNotes";

function todayKeyValue() {
  return new Date().toISOString().slice(0, 10);
}

/** ①②③のツェッテルカステン本体の代わりに、ペイン部分にそのままカレンダー
 * （今日／タイムライン）を表示する — /calendar ページ自体と違い、ここでの
 * 表示切り替えはURLのクエリではなくローカル状態で行う（このペインは
 * ZettelkastenScreen上のインプレース表示なので、独立したルートではない）。 */
export function ZettelkastenCalendarPane({
  onOpenProjectDay,
}: {
  onOpenProjectDay: (projectId: string, dateKey: string) => void;
}) {
  const { t, locale } = useI18n();
  const [view, setView] = useState<"today" | "timeline">("today");
  const [todayNotes, setTodayNotes] = useState<TodayProjectNote[] | null>(null);
  const [timelineMarks, setTimelineMarks] = useState<ProjectTimelineMark[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (view === "today" && todayNotes === null) {
      listTodayProjectNotesAction(todayKeyValue()).then((result) => {
        if (!cancelled) setTodayNotes(result);
      });
    }
    if (view === "timeline" && timelineMarks === null) {
      listTimelineMarksAction().then((result) => {
        if (!cancelled) setTimelineMarks(result);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [view, todayNotes, timelineMarks]);

  const todayKey = todayKeyValue();
  const today = new Date(`${todayKey}T00:00:00.000Z`);
  const todayLabel = today.toLocaleDateString(localeTag(locale), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // The timeline currently spans a project's whole lifetime, but that won't
  // hold once it's paginated by month — so its title only ever commits to
  // month-level granularity, never a specific day.
  const monthLabel = today.toLocaleDateString(localeTag(locale), { year: "numeric", month: "2-digit" });

  return (
    <div className="mx-auto flex w-full max-w-[860px] flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-extrabold tracking-tight text-ink">{view === "today" ? todayLabel : monthLabel}</h1>
        <div className="flex gap-1.5 rounded-full border border-line-strong bg-surface p-1">
          {(["today", "timeline"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-3 py-1.5 font-mono text-[10.5px] transition-colors ${
                view === v ? "bg-accent text-on-accent" : "text-ink-soft hover:text-accent"
              }`}
            >
              {v === "today" ? t.calendar.viewToday : t.calendar.viewTimeline}
            </button>
          ))}
        </div>
      </div>

      {view === "today" &&
        (todayNotes === null ? (
          <LoadingBlock label={t.calendar.projectTaskLoading} />
        ) : (
          <CalendarTodayView initialNotes={todayNotes} />
        ))}

      {view === "timeline" &&
        (timelineMarks === null ? (
          <LoadingBlock label={t.calendar.projectTaskLoading} />
        ) : (
          <CalendarTimelineView marks={timelineMarks} todayKey={todayKey} onOpenProjectDay={onOpenProjectDay} />
        ))}
    </div>
  );
}
