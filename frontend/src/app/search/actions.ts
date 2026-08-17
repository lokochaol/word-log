"use server";

import * as quickNotes from "@/lib/quickNotes";
import * as permanentNotes from "@/lib/permanentNotes";
import { requireOwnerSub } from "@/lib/session";

export interface UnifiedSearchResult {
  kind: "QUICK_NOTE" | "PERMANENT_NOTE";
  id: string;
  label: string;
}

/** Cross-searches active QuickNotes and PermanentNotes, tagging each hit with `kind` for the UI badge. */
export async function searchAllAction(query: string): Promise<UnifiedSearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  const ownerSub = await requireOwnerSub();

  const [quick, permanent] = await Promise.all([
    quickNotes.search(ownerSub, q),
    permanentNotes.search(ownerSub, q),
  ]);

  return [
    ...quick.map((n) => ({ kind: "QUICK_NOTE" as const, id: n.id, label: n.preview || "(内容未記入)" })),
    ...permanent.map((n) => ({ kind: "PERMANENT_NOTE" as const, id: n.id, label: n.title })),
  ];
}
