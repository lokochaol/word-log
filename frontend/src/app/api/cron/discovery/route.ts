import { NextResponse, type NextRequest } from "next/server";
import * as discovery from "@/lib/discovery";

/**
 * The scheduled half of the twice-daily (7:00/19:00 JST) "Discovery Rails"
 * batch — see frontend/vercel.json for the two cron schedules that call this,
 * and DiscoveryTriggerButton for the manual, single-owner equivalent.
 *
 * There is no browser session here (Vercel Cron calls this server-to-server),
 * so this can't use requireOwnerSub() — instead it's gated by CRON_SECRET, the
 * shared secret Vercel Cron sends as `Authorization: Bearer <CRON_SECRET>`
 * when that env var is set. Without CRON_SECRET configured this always
 * rejects, rather than running unauthenticated for every tenant.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const owners = await discovery.listOwnersWithActiveNotes();
  let notesChecked = 0;
  let candidatesFound = 0;
  for (const ownerSub of owners) {
    const result = await discovery.runForActiveNotes(ownerSub);
    notesChecked += result.notesChecked;
    candidatesFound += result.candidatesFound;
  }

  return NextResponse.json({ owners: owners.length, notesChecked, candidatesFound });
}
