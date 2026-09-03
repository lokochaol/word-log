"use client";

import { useRouter } from "next/navigation";
import { CalendarTimelineView } from "@/components/CalendarTimelineView";
import type { ProjectTimelineMark } from "@/lib/projectTaskNotes";

/** Thin client wrapper so /calendar (a Server Component page) can still give
 * CalendarTimelineView a day-selection handler — tapping a day navigates to
 * `?view=day&date=...`, keeping the current `year`/`month` so "戻る" can
 * return to the same month. */
export function CalendarTimelineSection({
  marks,
  year,
  month,
  todayKey,
}: {
  marks: ProjectTimelineMark[];
  year: number;
  month: number;
  todayKey: string;
}) {
  const router = useRouter();

  return (
    <CalendarTimelineView
      marks={marks}
      year={year}
      month={month}
      todayKey={todayKey}
      onSelectDay={(dateKey) => router.push(`/calendar?view=day&date=${dateKey}&year=${year}&month=${month}`)}
    />
  );
}
