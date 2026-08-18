"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { NoteTimeline } from "@/components/NoteTimeline";
import { AddLiteratureMemoButton } from "@/components/AddLiteratureMemoButton";
import type { LiteratureMemoSummary } from "@/lib/literatureMemos";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { localeTag } from "@/lib/i18n/dictionary";

export function LiteratureMemoList({ initialMemos }: { initialMemos: LiteratureMemoSummary[] }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialMemos;
    return initialMemos.filter((m) => m.citation.toLowerCase().includes(q));
  }, [initialMemos, query]);

  return (
    <div className="flex flex-col gap-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.literature.filterPlaceholder}
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none"
      />

      <NoteTimeline
        emptyLabel={initialMemos.length === 0 ? t.literature.emptyAll : t.literature.emptyFiltered}
        rows={filtered.map((m) => ({
          key: m.id,
          meta: (
            <span className="font-mono text-[9.5px] text-ink-faint">
              {new Date(m.updatedAt).toLocaleDateString(localeTag(locale))}
              {m.zoteroKey && <span className="ml-1.5 text-accent">Zotero</span>}
            </span>
          ),
          card: (
            <Link
              href={`/literature/${m.id}`}
              className="flex w-full max-w-[420px] flex-col gap-1.5 rounded-lg border border-line bg-surface-alt p-3.5 transition-colors hover:border-accent/60"
            >
              <p className="text-sm font-semibold text-ink">{m.citation}</p>
              {m.summary && <p className="line-clamp-2 text-xs text-ink-soft">{m.summary}</p>}
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full border border-line-strong px-2 py-0.5 font-mono text-[9.5px] text-ink-soft">
                  {t.literature.quickNoteCount(m.quickNoteCount)}
                </span>
                <span
                  className={`rounded-full border border-line-strong px-2 py-0.5 font-mono text-[9.5px] text-ink-soft ${
                    m.permanentNoteCount === 0 ? "opacity-40" : ""
                  }`}
                >
                  {t.literature.permanentNoteCount(m.permanentNoteCount)}
                </span>
              </div>
            </Link>
          ),
        }))}
      />

      <AddLiteratureMemoButton onCreated={(memo) => router.push(`/literature/${memo.id}`)} />
    </div>
  );
}
