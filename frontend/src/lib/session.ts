import { auth } from "@/auth";
import type { Session } from "next-auth";

type AuthedSession = Session & { ownerSub: string };

/** Every route that reaches here is already gated by proxy.ts, so a missing session is a bug, not a normal case. */
export async function requireSession(): Promise<AuthedSession> {
  const session = await auth();
  if (!session?.ownerSub) {
    throw new Error("No authenticated user in session");
  }
  return session as AuthedSession;
}

export async function requireOwnerSub(): Promise<string> {
  const session = await requireSession();
  return session.ownerSub;
}
