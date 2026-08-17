/**
 * Zotero Web API integration (§8). Server-only env vars — no NEXT_PUBLIC_
 * prefix, never sent to the client:
 *   ZOTERO_API_KEY, ZOTERO_LIBRARY_ID, ZOTERO_LIBRARY_TYPE ("user"|"group", default "user")
 *
 * When the env vars are absent (as in this environment), searchItems throws
 * ZoteroConfigError. Callers (the scratch Server Action) catch that and
 * surface a "Zotero未設定" state in the UI — manual citation entry keeps
 * working regardless.
 */

export class ZoteroConfigError extends Error {}
export class ZoteroApiError extends Error {}

export interface ZoteroSearchResult {
  key: string;
  title: string;
  creators: string;
  year: string | null;
  itemType: string;
  citation: string;
  url: string | null;
}

export function isZoteroConfigured(): boolean {
  return !!(process.env.ZOTERO_API_KEY && process.env.ZOTERO_LIBRARY_ID);
}

interface ZoteroCreator {
  firstName?: string;
  lastName?: string;
  name?: string;
}

interface ZoteroItemData {
  title?: string;
  itemType?: string;
  date?: string;
  url?: string;
  creators?: ZoteroCreator[];
}

interface ZoteroApiItem {
  key: string;
  citation?: string;
  data?: ZoteroItemData;
}

function formatCreators(creators: ZoteroCreator[] | undefined): string {
  if (!creators || creators.length === 0) return "";
  return creators
    .map((c) => c.name ?? [c.lastName, c.firstName].filter(Boolean).join(" "))
    .filter(Boolean)
    .join(", ");
}

function extractYear(date: string | undefined): string | null {
  if (!date) return null;
  const match = date.match(/\d{4}/);
  return match ? match[0] : null;
}

export async function searchItems(query: string, limit = 10): Promise<ZoteroSearchResult[]> {
  const apiKey = process.env.ZOTERO_API_KEY;
  const libraryId = process.env.ZOTERO_LIBRARY_ID;
  const libraryType = process.env.ZOTERO_LIBRARY_TYPE || "user";

  if (!apiKey || !libraryId) {
    throw new ZoteroConfigError("Zotero未設定: ZOTERO_API_KEY / ZOTERO_LIBRARY_ID を設定してください");
  }

  const q = query.trim();
  if (!q) return [];

  const url = new URL(`https://api.zotero.org/${libraryType}s/${libraryId}/items`);
  url.searchParams.set("q", q);
  url.searchParams.set("qmode", "titleCreatorYear");
  url.searchParams.set("format", "json");
  url.searchParams.set("include", "citation,data");
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url, {
    headers: {
      "Zotero-API-Key": apiKey,
      "Zotero-API-Version": "3",
    },
  });

  if (!res.ok) {
    throw new ZoteroApiError(`Zotero API error: ${res.status} ${res.statusText}`);
  }

  const items = (await res.json()) as ZoteroApiItem[];

  return items
    .filter((item) => item.data?.itemType !== "attachment" && item.data?.itemType !== "note")
    .map((item) => ({
      key: item.key,
      title: item.data?.title ?? "(無題)",
      creators: formatCreators(item.data?.creators),
      year: extractYear(item.data?.date),
      itemType: item.data?.itemType ?? "",
      citation: (item.citation ?? item.data?.title ?? "").replace(/<[^>]+>/g, ""),
      url: item.data?.url ?? null,
    }));
}
