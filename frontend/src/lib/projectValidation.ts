import { getDictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/types";

/**
 * Pure types + validator for a Project's goal ladder, split out of
 * src/lib/projects.ts specifically so it has NO import of @/lib/db (Prisma +
 * `pg`) — mirrors src/lib/promotionValidation.ts, which exists for the same
 * reason (bundleable for client components that inline-validate before
 * submitting).
 */

export interface ProjectGoals {
  goalUltimate: string | null;
  goalYear3: string | null;
  goalYear2: string | null;
  goalYear1: string | null;
  goalMonth3: string | null;
  goalMonth1: string | null;
  goalDay: string | null;
}

/**
 * Every goal tier is optional — but per spec, the moment ANY tier is set,
 * goalUltimate ("最終目標") and goalDay ("1日の目標") both become required.
 * Returns a list of human-readable problems; empty means valid.
 */
export function validateGoals(goals: ProjectGoals, locale: Locale = "ja"): string[] {
  const dict = getDictionary(locale).validation;
  const anySet = Object.values(goals).some((v) => v && v.trim());
  if (!anySet) return [];

  const problems: string[] = [];
  if (!goals.goalUltimate?.trim()) problems.push(dict.goalUltimateRequired);
  if (!goals.goalDay?.trim()) problems.push(dict.goalDayRequired);
  return problems;
}
