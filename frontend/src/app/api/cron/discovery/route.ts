import { NextResponse, type NextRequest } from "next/server";
import * as discovery from "@/lib/discovery";

/**
 * The scheduled half of the "Discovery Rails" batch — see
 * frontend/vercel.json, which fires this hourly, and DiscoveryTriggerButton
 * for the manual, single-owner, schedule-ignoring equivalent.
 *
 * Firing hourly (rather than at two fixed times) is what makes each owner's
 * own DiscoverySchedule (1 or 2 times a day, at whichever Asia/Tokyo
 * hour(s) they picked in Settings — src/lib/discovery.ts's
 * getSchedule/isDueAtHour) actually take effect: every pass checks the
 * current Tokyo hour against each owner's schedule and only runs discovery
 * for the ones due *this* hour.
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

  const hour = discovery.tokyoHour(new Date());
  const owners = await discovery.listOwnersWithActiveNotes();

  let ownersRun = 0;
  let notesChecked = 0;
  let candidatesFound = 0;
  for (const ownerSub of owners) {
    const schedule = await discovery.getSchedule(ownerSub);
    if (!discovery.isDueAtHour(schedule, hour)) continue;

    ownersRun++;
    const result = await discovery.runForActiveNotes(ownerSub);
    notesChecked += result.notesChecked;
    candidatesFound += result.candidatesFound;
  }

  return NextResponse.json({ hour, owners: owners.length, ownersRun, notesChecked, candidatesFound });
}
