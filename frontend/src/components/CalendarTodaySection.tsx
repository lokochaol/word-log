"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { LoadingBlock } from "@/components/LoadingSpinner";
import { CalendarTodayView } from "@/components/CalendarTodayView";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { localeTag } from "@/lib/i18n/dictionary";
import { listTodayProjectNotesAction } from "@/app/calendar/actions";
import type { TodayProjectNote } from "@/lib/projectTaskNotes";

/** How many days' worth of notes stay cached at once (least-recently-viewed
 * evicted first once exceeded) — enough for a session of hopping back and
 * forth over a couple of weeks without the cache growing unbounded. */
const CACHE_LIMIT = 14;

function todayKeyValue() {
  return new Date().toISOString().slice(0, 10);
}

function shiftDateKey(dateKey: string, delta: number): string {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/**
 * ③今日の表示 — lets you step to the day before/after (and jump back to
 * today), not just view today itself. The viewed day plus its immediate
 * neighbors are pre-fetched and cached as soon as you land on a day, so
 * stepping ±1 never shows a loading flash: the whole point is that hopping
 * to yesterday to copy something and back to today to paste it should never
 * interrupt what's already on screen or reset a text selection mid-copy.
 * The cache itself is capped (CACHE_LIMIT) and evicts whichever cached day
 * was viewed least recently once full, rather than growing forever.
 */
export function CalendarTodaySection({
  initialNotes,
  onOpenProject,
  headerRight,
}: {
  /** Seeds the cache for today specifically, so the standalone /calendar
   * page's SSR-fetched data doesn't get re-fetched on mount. Omit to always
   * fetch client-side (the inline Zettelkasten pane has no SSR data). */
  initialNotes?: TodayProjectNote[];
  onOpenProject?: (projectId: string) => void;
  /** Rendered at the right edge of the same header row as the day nav —
   * callers place their ③今日／④タイムライン view-switch pills here so the
   * row layout matches the timeline view's own header exactly. */
  headerRight?: ReactNode;
}) {
  const { t, locale } = useI18n();
  const todayKey = todayKeyValue();
  const [viewedDateKey, setViewedDateKey] = useState(todayKey);
  const [notesCache, setNotesCache] = useState<Record<string, TodayProjectNote[]>>(
    initialNotes ? { [todayKey]: initialNotes } : {},
  );
  // Recency order (oldest-viewed first) for eviction — a ref, not state, so
  // recording a visit doesn't itself trigger a render; only the async fetch
  // completions below ever call setNotesCache.
  const recencyRef = useRef<string[]>(initialNotes ? [todayKey] : []);

  function touchRecency(key: string) {
    recencyRef.current = [...recencyRef.current.filter((k) => k !== key), key];
  }

  useEffect(() => {
    let cancelled = false;
    touchRecency(viewedDateKey);

    const wanted = [viewedDateKey, shiftDateKey(viewedDateKey, -1), shiftDateKey(viewedDateKey, 1)];
    for (const key of wanted) {
      if (notesCache[key] !== undefined) continue;
      listTodayProjectNotesAction(key).then((result) => {
        if (cancelled) return;
        setNotesCache((prev) => {
          if (prev[key] !== undefined) return prev;
          const next = { ...prev, [key]: result };
          const keys = Object.keys(next);
          if (keys.length > CACHE_LIMIT) {
            const byRecency = recencyRef.current.filter((k) => k in next);
            for (const evictKey of byRecency.slice(0, keys.length - CACHE_LIMIT)) {
              delete next[evictKey];
            }
          }
          return next;
        });
      });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewedDateKey]);

  const viewedLabel = new Date(`${viewedDateKey}T00:00:00.000Z`).toLocaleDateString(localeTag(locale), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const isToday = viewedDateKey === todayKey;
  const viewedNotes = notesCache[viewedDateKey];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewedDateKey((k) => shiftDateKey(k, -1))}
            aria-label={t.calendar.prevDay}
            className="flex h-6 w-6 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface-alt hover:text-accent"
          >
            ‹
          </button>
          <h1 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-ink">
            {viewedLabel}
            {isToday && (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[9px] tracking-wider text-accent uppercase">
                {t.calendar.todayBadge}
              </span>
            )}
          </h1>
          <button
            onClick={() => setViewedDateKey((k) => shiftDateKey(k, 1))}
            aria-label={t.calendar.nextDay}
            className="flex h-6 w-6 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface-alt hover:text-accent"
          >
            ›
          </button>
          {!isToday && (
            <button
              onClick={() => setViewedDateKey(todayKey)}
              className="rounded-full border border-line-strong px-2.5 py-1 font-mono text-[10px] text-ink-soft transition-colors hover:border-accent hover:text-accent"
            >
              {t.calendar.backToToday}
            </button>
          )}
        </div>
        {headerRight}
      </div>

      {viewedNotes === undefined ? (
        <LoadingBlock label={t.calendar.projectTaskLoading} />
      ) : (
        <CalendarTodayView key={viewedDateKey} dateKey={viewedDateKey} initialNotes={viewedNotes} onOpenProject={onOpenProject} />
      )}
    </div>
  );
}
