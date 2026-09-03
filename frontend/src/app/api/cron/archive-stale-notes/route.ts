import { NextResponse, type NextRequest } from "next/server";
import * as quickNoteArchiving from "@/lib/quickNoteArchiving";

/**
 * The stale-Dash-Off sweep: a QuickNote with no Project that's sat ACTIVE
 * for more than a week is archived as unorganized clutter (archiveReason
 * STALE) — see src/lib/quickNoteArchiving.ts. Unlike the Discovery cron
 * (src/app/api/cron/discovery), this only needs to run once a day, so a
 * single vercel.json entry is enough — no 24-entry hourly-approximation
 * trick required.
 *
 * Gated by CRON_SECRET the same way the Discovery cron is — there's no
 * browser session here (Vercel Cron calls this server-to-server).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const owners = await quickNoteArchiving.listOwnersWithStaleCandidateNotes();
  let archived = 0;
  for (const ownerSub of owners) {
    archived += await quickNoteArchiving.archiveStaleQuickNotes(ownerSub);
  }

  return NextResponse.json({ owners: owners.length, archived });
}
