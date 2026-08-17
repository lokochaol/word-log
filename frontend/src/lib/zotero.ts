/**
 * Zotero Web API integration (§8) — this is a multi-tenant app, so each
 * owner's credentials live in the ZoteroCredential table (src/lib/
 * zoteroCredentials.ts), never in a single app-wide env var. This module is
 * a pure API client: it takes credentials explicitly and knows nothing about
 * who the caller is.
 *
 * When an owner hasn't linked a Zotero library, the caller (the scratch
 * Server Action) never even calls searchItems — it surfaces an
 * "unconfigured" state in the UI and manual citation entry keeps working
 * regardless.
 */

export class ZoteroApiError extends Error {}

export interface ZoteroCredential {
  apiKey: string;
  libraryId: string;
  libraryType: string;
}

export interface ZoteroSearchResult {
  key: string;
  title: string;
  creators: string;
  year: string | null;
  itemType: string;
  citation: string;
  url: string | null;
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

export async function searchItems(
  credential: ZoteroCredential,
  query: string,
  limit = 10,
): Promise<ZoteroSearchResult[]> {
  const { apiKey, libraryId, libraryType } = credential;

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
