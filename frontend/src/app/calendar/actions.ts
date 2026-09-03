"use server";

import { revalidatePath } from "next/cache";
import * as projectTaskNotes from "@/lib/projectTaskNotes";
import type { TodayProjectNote, ProjectTimelineMark, ProjectTaskNoteView } from "@/lib/projectTaskNotes";
import { requireOwnerSub } from "@/lib/session";

export async function listTodayProjectNotesAction(dateKey: string): Promise<TodayProjectNote[]> {
  const ownerSub = await requireOwnerSub();
  return projectTaskNotes.listAllProjectsTodayNotes(ownerSub, dateKey);
}

export async function listTimelineMarksAction(year: number, month: number): Promise<ProjectTimelineMark[]> {
  const ownerSub = await requireOwnerSub();
  return projectTaskNotes.listTimelineMarks(ownerSub, year, month);
}

/** Editing a project's task note directly from Calendar's 今日 view — same
 * upsert the Project detail page's day view uses (src/app/projects/actions.ts),
 * duplicated here so this domain's Server Actions don't reach across into
 * another route's actions file. */
export async function upsertCalendarTaskNoteAction(
  projectId: string,
  dateKey: string,
  content: string,
): Promise<ProjectTaskNoteView> {
  const ownerSub = await requireOwnerSub();
  const note = await projectTaskNotes.upsertContent(ownerSub, projectId, dateKey, content);
  revalidatePath("/calendar");
  revalidatePath(`/projects/${projectId}`);
  return note;
}
