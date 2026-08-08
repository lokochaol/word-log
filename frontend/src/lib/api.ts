import { auth } from "@/auth";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const session = await auth();
  if (!session?.idToken) {
    throw new ApiError(401, "Not authenticated");
  }
  return { Authorization: `Bearer ${session.idToken}` };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await authHeader();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, text || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface WordSummary {
  id: string;
  text: string;
  encounteredAt: string;
}

export interface RelatedWord {
  relationId: string;
  text: string;
  wordId: string | null;
}

export type MeaningBlockType = "TEXT" | "CODE" | "MERMAID" | "IMAGE";

export interface MeaningBlock {
  id: string;
  type: MeaningBlockType;
  content: string;
  language: string | null;
  caption: string | null;
}

export interface MeaningBlockInput {
  type: MeaningBlockType;
  content: string;
  language?: string | null;
  caption?: string | null;
}

export interface WordDetail {
  id: string;
  text: string;
  meaning: string | null;
  meaningBlocks: MeaningBlock[];
  encounteredAt: string;
  updatedAt: string;
  relatedWords: RelatedWord[];
}

export interface SearchResult {
  id: string;
  text: string;
  meaning: string | null;
}

export interface RelatedSuggestion {
  wordId: string;
  text: string;
  reason: "FUZZY_MATCH" | "REVERSE_RELATION";
  score: number | null;
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const api = {
  listWords: (page = 0, size = 50) =>
    request<PageResponse<WordSummary>>(`/api/words?page=${page}&size=${size}&sort=encounteredAt,asc`),

  getWord: (id: string) => request<WordDetail>(`/api/words/${id}`),

  createWord: (text: string) =>
    request<WordDetail>(`/api/words`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  replaceMeaningBlocks: (id: string, blocks: MeaningBlockInput[]) =>
    request<WordDetail>(`/api/words/${id}/meaning-blocks`, {
      method: "PUT",
      body: JSON.stringify({ blocks }),
    }),

  addRelatedWord: (id: string, text: string) =>
    request<WordDetail>(`/api/words/${id}/related`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  removeRelatedWord: (id: string, relationId: string) =>
    request<void>(`/api/words/${id}/related/${relationId}`, {
      method: "DELETE",
    }),

  suggestRelatedWords: (id: string, limit = 8) =>
    request<RelatedSuggestion[]>(`/api/words/${id}/related/suggestions?limit=${limit}`),

  search: (query: string, limit = 20) =>
    request<SearchResult[]>(`/api/words/search?q=${encodeURIComponent(query)}&limit=${limit}`),
};
