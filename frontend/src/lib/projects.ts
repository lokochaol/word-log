import { prisma } from "@/lib/db";
import type { Project, ProjectStatus } from "@/generated/prisma/client";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { validateGoals, type ProjectGoals } from "@/lib/projectValidation";
import type { Locale } from "@/lib/i18n/types";

export interface ProjectSummary {
  id: string;
  name: string;
  isDefault: boolean;
  status: ProjectStatus;
  startedAt: Date;
  closedAt: Date | null;
}

export interface ProjectDetail extends ProjectSummary, ProjectGoals {
  createdAt: Date;
  updatedAt: Date;
}

function toSummary(project: Project): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    isDefault: project.isDefault,
    status: project.status,
    startedAt: project.startedAt,
    closedAt: project.closedAt,
  };
}

function toDetail(project: Project): ProjectDetail {
  return {
    ...toSummary(project),
    goalUltimate: project.goalUltimate,
    goalYear3: project.goalYear3,
    goalYear2: project.goalYear2,
    goalYear1: project.goalYear1,
    goalMonth3: project.goalMonth3,
    goalMonth1: project.goalMonth1,
    goalDay: project.goalDay,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export async function requireOwnedProject(ownerSub: string, id: string): Promise<Project> {
  const project = await prisma.project.findFirst({ where: { id, ownerSub } });
  if (!project) throw new NotFoundError("projectNotFound", `Project not found: ${id}`);
  return project;
}

/** Lazily creates the owner's single default "自分" project on first need —
 * named from their real OAuth display name, so a DB migration can't seed it
 * (it has no access to that name). Every owner ends up with exactly one. */
export async function ensureDefaultProject(ownerSub: string, displayName: string): Promise<ProjectSummary> {
  const existing = await prisma.project.findFirst({ where: { ownerSub, isDefault: true } });
  if (existing) return toSummary(existing);
  const created = await prisma.project.create({
    data: { ownerSub, name: displayName, isDefault: true },
  });
  return toSummary(created);
}

export async function listActive(ownerSub: string): Promise<ProjectSummary[]> {
  const projects = await prisma.project.findMany({
    where: { ownerSub, status: "ACTIVE" },
    orderBy: [{ isDefault: "desc" }, { startedAt: "asc" }],
  });
  return projects.map(toSummary);
}

export async function getDetail(ownerSub: string, id: string): Promise<ProjectDetail> {
  const project = await requireOwnedProject(ownerSub, id);
  return toDetail(project);
}

export async function create(ownerSub: string, name: string): Promise<ProjectSummary> {
  const trimmed = name.trim();
  if (!trimmed) throw new ValidationError("projectNameRequired", "Project name is required");
  const created = await prisma.project.create({ data: { ownerSub, name: trimmed } });
  return toSummary(created);
}

export async function rename(ownerSub: string, id: string, name: string): Promise<ProjectSummary> {
  await requireOwnedProject(ownerSub, id);
  const trimmed = name.trim();
  if (!trimmed) throw new ValidationError("projectNameRequired", "Project name is required");
  const updated = await prisma.project.update({ where: { id }, data: { name: trimmed } });
  return toSummary(updated);
}

export async function updateGoals(
  ownerSub: string,
  id: string,
  goals: ProjectGoals,
  locale: Locale = "ja",
): Promise<ProjectDetail> {
  await requireOwnedProject(ownerSub, id);
  const problems = validateGoals(goals, locale);
  if (problems.length > 0) {
    throw new ValidationError("projectGoalInvalid", "Invalid project goals", problems.join(" / "));
  }
  const updated = await prisma.project.update({ where: { id }, data: goals });
  return toDetail(updated);
}

/** The only way a Project ever closes — never tied to a goal deadline. Sweeps
 * every still-ACTIVE QuickNote linked to it into ARCHIVED/PROJECT_CLOSED
 * alongside it. PermanentNote has no active/archived concept at all, so
 * nothing to sweep there. */
export async function close(ownerSub: string, id: string): Promise<ProjectDetail> {
  const project = await requireOwnedProject(ownerSub, id);
  if (project.status === "CLOSED") return toDetail(project);

  const [updated] = await prisma.$transaction([
    prisma.project.update({ where: { id }, data: { status: "CLOSED", closedAt: new Date() } }),
    prisma.quickNote.updateMany({
      where: { projectId: id, status: "ACTIVE" },
      data: { status: "ARCHIVED", archiveReason: "PROJECT_CLOSED" },
    }),
  ]);
  return toDetail(updated);
}

export interface LinkedQuickNoteRef {
  id: string;
  preview: string;
  status: "ACTIVE" | "ARCHIVED";
}

export interface LinkedPermanentNoteRef {
  id: string;
  title: string;
}

function previewFrom(content: string): string {
  const firstLine = content.split("\n").find((line) => line.trim().length > 0);
  return firstLine?.trim().slice(0, 200) ?? "";
}

/** Drives the Project detail page's "紐づいたメモ" list — every QuickNote and
 * PermanentNote ever linked to this project, regardless of QuickNote status
 * (an ARCHIVED one linked here was swept in by a project close, not deleted). */
export async function listLinkedNotes(
  ownerSub: string,
  id: string,
): Promise<{ quickNotes: LinkedQuickNoteRef[]; permanentNotes: LinkedPermanentNoteRef[] }> {
  await requireOwnedProject(ownerSub, id);
  const [quickNotes, permanentNotes] = await Promise.all([
    prisma.quickNote.findMany({
      where: { projectId: id, ownerSub },
      orderBy: { encounteredAt: "desc" },
    }),
    prisma.permanentNote.findMany({
      where: { projectId: id, ownerSub },
      orderBy: { orderKey: "asc" },
    }),
  ]);
  return {
    quickNotes: quickNotes.map((n) => ({ id: n.id, preview: previewFrom(n.content), status: n.status })),
    permanentNotes: permanentNotes.map((n) => ({ id: n.id, title: n.title })),
  };
}
