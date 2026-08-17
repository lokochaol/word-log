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

export const CREATABLE_ITEM_TYPES = ["book", "journalArticle", "webpage"] as const;
export type CreatableItemType = (typeof CREATABLE_ITEM_TYPES)[number];

export interface CreateItemInput {
  itemType: CreatableItemType;
  title: string;
  creator?: string;
  date?: string;
  url?: string;
}

/**
 * Creates a new item in the owner's Zotero library when a search comes up
 * empty. Requires a write-scoped API key (the default read-only key from
 * zotero.org/settings/keys will fail here with a 403) — NOT verified against
 * a live Zotero API in this environment; the request shape follows Zotero's
 * documented "multi-item write" format (an array body, one item), but the
 * exact response envelope should be double-checked against a real 200/403
 * response the first time this runs for real.
 */
export async function createItem(
  credential: ZoteroCredential,
  input: CreateItemInput,
): Promise<ZoteroSearchResult> {
  const { apiKey, libraryId, libraryType } = credential;
  const title = input.title.trim();
  if (!title) throw new ZoteroApiError("タイトルを入力してください");

  const url = new URL(`https://api.zotero.org/${libraryType}s/${libraryId}/items`);
  url.searchParams.set("include", "citation,data");

  const body = [
    {
      itemType: input.itemType,
      title,
      creators: input.creator?.trim() ? [{ creatorType: "author", name: input.creator.trim() }] : [],
      date: input.date?.trim() || undefined,
      url: input.url?.trim() || undefined,
    },
  ];

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Zotero-API-Key": apiKey,
      "Zotero-API-Version": "3",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.status === 403) {
    throw new ZoteroApiError(
      "Zoteroへの書き込みが拒否されました。APIキーに書き込み権限（Write Access）を付けて再発行してください。",
    );
  }
  if (!res.ok) {
    throw new ZoteroApiError(`Zotero API error: ${res.status} ${res.statusText}`);
  }

  const payload = (await res.json()) as { successful?: Record<string, ZoteroApiItem>; failed?: Record<string, unknown> };
  const created = payload.successful?.["0"];
  if (!created) {
    throw new ZoteroApiError("Zoteroへの登録に失敗しました");
  }

  return {
    key: created.key,
    title: created.data?.title ?? title,
    creators: formatCreators(created.data?.creators),
    year: extractYear(created.data?.date),
    itemType: created.data?.itemType ?? input.itemType,
    citation: (created.citation ?? created.data?.title ?? title).replace(/<[^>]+>/g, ""),
    url: created.data?.url ?? null,
  };
}
