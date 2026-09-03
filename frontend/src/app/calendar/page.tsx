import Link from "next/link";
import { requireSession } from "@/lib/session";
import * as projectTaskNotes from "@/lib/projectTaskNotes";
import { CalendarViewSwitch } from "@/components/CalendarViewSwitch";
import { CalendarMonthNav } from "@/components/CalendarMonthNav";
import { CalendarTodayView } from "@/components/CalendarTodayView";
import { CalendarTimelineView } from "@/components/CalendarTimelineView";
import { HeaderMenu } from "@/components/HeaderMenu";
import { HeaderAccountBadge } from "@/components/HeaderAccountBadge";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary, localeTag } from "@/lib/i18n/dictionary";

export default async function CalendarPage(props: PageProps<"/calendar">) {
  const searchParams = await props.searchParams;
  const session = await requireSession();
  const ownerSub = session.ownerSub;
  const locale = await getLocale();
  const dict = getDictionary(locale);

  const view = searchParams.view === "timeline" ? "timeline" : "today";
  const todayKey = projectTaskNotes.todayKey();
  const today = new Date(`${todayKey}T00:00:00.000Z`);
  const todayLabel = today.toLocaleDateString(localeTag(locale), { year: "numeric", month: "2-digit", day: "2-digit" });

  const currentYear = today.getUTCFullYear();
  const currentMonth = today.getUTCMonth() + 1;
  const requestedYear = Number(searchParams.year);
  const requestedMonth = Number(searchParams.month);
  const isValidRequestedMonth =
    Number.isInteger(requestedYear) && Number.isInteger(requestedMonth) && requestedMonth >= 1 && requestedMonth <= 12;
  let viewedYear = isValidRequestedMonth ? requestedYear : currentYear;
  let viewedMonth = isValidRequestedMonth ? requestedMonth : currentMonth;
  // Clamp to the current month rather than trust an arbitrary future ?year=/?month= —
  // a project can't have notes ahead of today.
  if (viewedYear > currentYear || (viewedYear === currentYear && viewedMonth > currentMonth)) {
    viewedYear = currentYear;
    viewedMonth = currentMonth;
  }
  const isCurrentViewedMonth = viewedYear === currentYear && viewedMonth === currentMonth;
  const monthLabel = new Date(Date.UTC(viewedYear, viewedMonth - 1, 1)).toLocaleDateString(localeTag(locale), {
    year: "numeric",
    month: "2-digit",
  });

  const todayNotes = view === "today" ? await projectTaskNotes.listAllProjectsTodayNotes(ownerSub, todayKey) : [];
  const timelineMarks =
    view === "timeline" ? await projectTaskNotes.listTimelineMarks(ownerSub, viewedYear, viewedMonth) : [];

  return (
    <main className="flex min-h-screen flex-col items-center bg-bg px-6 py-16">
      <div className="flex w-full max-w-[860px] flex-col gap-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/scratch"
            className="inline-flex w-fit items-center gap-1.5 font-mono text-xs font-medium tracking-wide text-ink-soft transition-colors hover:text-accent"
          >
            <span className="text-accent">&lt;</span> {dict.calendar.backToScratch}
          </Link>
          <HeaderMenu>
            <div className="flex w-full flex-col items-end gap-1.5 border-b border-line pb-2.5">
              <HeaderAccountBadge email={session.user?.email ?? dict.common.unknownEmail} />
              <Link href="/settings" className="font-mono text-[10px] text-ink-soft transition-colors hover:text-accent">
                {dict.nav.settingsLabel}
              </Link>
            </div>
            <Link href="/projects" className="font-mono text-[10px] text-ink-soft transition-colors hover:text-accent">
              {dict.nav.projectsLabel}
            </Link>
            <Link href="/literature" className="font-mono text-[10px] text-ink-soft transition-colors hover:text-accent">
              {dict.nav.literatureLabel}
            </Link>
            <Link href="/guide" className="font-mono text-[10px] text-ink-soft transition-colors hover:text-accent">
              {dict.nav.guideLabel}
            </Link>
          </HeaderMenu>
        </div>

        <div className="flex items-center justify-between gap-3">
          {view === "today" ? (
            <h1 className="text-lg font-extrabold tracking-tight text-ink">{todayLabel}</h1>
          ) : (
            <CalendarMonthNav year={viewedYear} month={viewedMonth} isCurrentMonth={isCurrentViewedMonth}>
              <h1 className="text-lg font-extrabold tracking-tight text-ink">{monthLabel}</h1>
            </CalendarMonthNav>
          )}
          <CalendarViewSwitch view={view} />
        </div>

        {view === "today" ? (
          <CalendarTodayView initialNotes={todayNotes} />
        ) : (
          <CalendarTimelineView marks={timelineMarks} year={viewedYear} month={viewedMonth} todayKey={todayKey} />
        )}
      </div>
    </main>
  );
}
