import { prisma } from "@/lib/db";
import * as projects from "@/lib/projects";

/**
 * A ProjectTaskNote's date is always handled as a plain "YYYY-MM-DD" string
 * (`dateKey`) everywhere outside this module — Prisma's `@db.Date` column is
 * the only place that needs an actual Date, and only ever at UTC midnight,
 * so a dateKey round-trips through it without any timezone drift.
 */

function toDate(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export interface ProjectTaskNoteView {
  projectId: string;
  date: string;
  content: string;
}

export async function getOrEmpty(ownerSub: string, projectId: string, dateKey: string): Promise<ProjectTaskNoteView> {
  await projects.requireOwnedProject(ownerSub, projectId);
  const row = await prisma.projectTaskNote.findUnique({
    where: { projectId_date: { projectId, date: toDate(dateKey) } },
  });
  return { projectId, date: dateKey, content: row?.content ?? "" };
}

export async function upsertContent(
  ownerSub: string,
  projectId: string,
  dateKey: string,
  content: string,
): Promise<ProjectTaskNoteView> {
  await projects.requireOwnedProject(ownerSub, projectId);
  const date = toDate(dateKey);
  const row = await prisma.projectTaskNote.upsert({
    where: { projectId_date: { projectId, date } },
    create: { projectId, date, content },
    update: { content },
  });
  return { projectId, date: dateKey, content: row.content };
}

export interface DayStripEntry {
  date: string;
  hasContent: boolean;
}

/** Backs the Project detail page's day-strip — the last `daysBack` days up
 * to and including today, oldest first. */
export async function listRecentDays(ownerSub: string, projectId: string, daysBack: number): Promise<DayStripEntry[]> {
  await projects.requireOwnedProject(ownerSub, projectId);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - daysBack);
  since.setUTCHours(0, 0, 0, 0);

  const rows = await prisma.projectTaskNote.findMany({
    where: { projectId, date: { gte: since } },
    select: { date: true, content: true },
  });
  const hasContentByDate = new Map(rows.map((r) => [toDateKey(r.date), r.content.trim().length > 0]));

  const result: DayStripEntry[] = [];
  for (let i = daysBack; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = toDateKey(d);
    result.push({ date: key, hasContent: hasContentByDate.get(key) ?? false });
  }
  return result;
}

export interface TodayProjectNote {
  projectId: string;
  projectName: string;
  isDefault: boolean;
  content: string;
}

/** Backs Calendar's "今日" view — every active project's note for the given
 * day, one entry each (empty string if that project has no note yet). */
export async function listAllProjectsTodayNotes(ownerSub: string, dateKey: string): Promise<TodayProjectNote[]> {
  const activeProjects = await projects.listActive(ownerSub);
  if (activeProjects.length === 0) return [];

  const date = toDate(dateKey);
  const rows = await prisma.projectTaskNote.findMany({
    where: { projectId: { in: activeProjects.map((p) => p.id) }, date },
  });
  const contentByProject = new Map(rows.map((r) => [r.projectId, r.content]));

  return activeProjects.map((p) => ({
    projectId: p.id,
    projectName: p.name,
    isDefault: p.isDefault,
    content: contentByProject.get(p.id) ?? "",
  }));
}

export interface ProjectTimelineMark {
  projectId: string;
  projectName: string;
  startedAt: Date;
  closedAt: Date | null;
  /** Every date (YYYY-MM-DD) this project has a task note on, for the tappable marks. */
  noteDates: string[];
}

/** Backs Calendar's 横向きタイムライン view — one line per active project,
 * spanning startedAt to now (or to closedAt, for a project closed since the
 * last render — though a closed project is filtered out of listActive
 * entirely, so in practice this only ever returns still-open projects). */
export async function listTimelineMarks(ownerSub: string): Promise<ProjectTimelineMark[]> {
  const activeProjects = await prisma.project.findMany({
    where: { ownerSub, status: "ACTIVE" },
    orderBy: [{ isDefault: "desc" }, { startedAt: "asc" }],
  });
  if (activeProjects.length === 0) return [];

  const notes = await prisma.projectTaskNote.findMany({
    where: { projectId: { in: activeProjects.map((p) => p.id) } },
    select: { projectId: true, date: true },
  });
  const datesByProject = new Map<string, string[]>();
  for (const n of notes) {
    const arr = datesByProject.get(n.projectId) ?? [];
    arr.push(toDateKey(n.date));
    datesByProject.set(n.projectId, arr);
  }

  return activeProjects.map((p) => ({
    projectId: p.id,
    projectName: p.name,
    startedAt: p.startedAt,
    closedAt: p.closedAt,
    noteDates: (datesByProject.get(p.id) ?? []).sort(),
  }));
}
