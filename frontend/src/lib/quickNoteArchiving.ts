import { prisma } from "@/lib/db";

const STALE_DAYS = 7;

/** A QuickNote with no Project is considered an unorganized scrap after
 * STALE_DAYS and gets swept — see archiveReason STALE. A QuickNote linked to
 * a Project is exempt until that Project itself closes (see
 * src/lib/projects.ts#close, archiveReason PROJECT_CLOSED). */
export async function archiveStaleQuickNotes(ownerSub: string): Promise<number> {
  const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);
  const result = await prisma.quickNote.updateMany({
    where: { ownerSub, status: "ACTIVE", projectId: null, createdAt: { lt: cutoff } },
    data: { status: "ARCHIVED", archiveReason: "STALE" },
  });
  return result.count;
}

export async function listOwnersWithStaleCandidateNotes(): Promise<string[]> {
  const rows = await prisma.quickNote.findMany({
    where: { status: "ACTIVE", projectId: null },
    distinct: ["ownerSub"],
    select: { ownerSub: true },
  });
  return rows.map((r) => r.ownerSub);
}
