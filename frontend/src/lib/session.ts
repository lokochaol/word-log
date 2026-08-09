import { auth } from "@/auth";

/** Every route that reaches here is already gated by proxy.ts, so a missing session is a bug, not a normal case. */
export async function requireOwnerSub(): Promise<string> {
  const session = await auth();
  if (!session?.ownerSub) {
    throw new Error("No authenticated user in session");
  }
  return session.ownerSub;
}
