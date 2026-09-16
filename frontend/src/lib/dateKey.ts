/**
 * "YYYY-MM-DD" day keys — the app's unit of "which day", used for project
 * task notes, the calendar's day view and the timeline's day axis.
 *
 * The thing to get right here is which clock decides what "today" is.
 * `new Date().toISOString().slice(0, 10)` (what this module replaces) asks
 * UTC, so for anyone east of Greenwich the app stayed on yesterday's date
 * until their morning, and for anyone west of it, it moved on early. The
 * key has to come from the owner's own calendar instead — hence an explicit
 * `timeZone`, which the server reads from the tz cookie (see
 * src/lib/preferences/) and the browser simply takes from itself.
 *
 * A key is stored as UTC midnight (see src/lib/projectTaskNotes.ts), so
 * anything rendering one back into a label has to format it in UTC too —
 * `formatDateKey` exists so that pairing isn't re-derived at every call
 * site.
 */

/** Formats an instant as the day it falls on in `timeZone` (the runtime's
 * own zone when omitted). */
export function toDateKey(date: Date, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Today in `timeZone`, or in the runtime's own zone — which in a browser is
 * the owner's, making this the right call in any Client Component. */
export function todayKey(timeZone?: string): string {
  return toDateKey(new Date(), timeZone);
}

/** The key `delta` days away. Done in UTC on purpose: a key is a plain
 * calendar day, so adding a day must never be nudged by a DST transition. */
export function shiftDateKey(dateKey: string, delta: number): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

/** Renders a key as a date label. Always UTC — a key is stored at UTC
 * midnight, so formatting it in any other zone would print the day before
 * or after for half the world. */
export function formatDateKey(
  dateKey: string,
  localeTag: string,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit" },
): string {
  return new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString(localeTag, { ...options, timeZone: "UTC" });
}
