"use client";

import { useEffect, useState, useTransition } from "react";
import { HudFrame } from "@/components/HudFrame";
import { setLiteratureMemoAction, zoteroSearchAction } from "@/app/scratch/actions";
import type { ZoteroSearchResult } from "@/lib/zotero";
import type { QuickNoteDetail } from "@/lib/quickNotes";

/**
 * Optional 文献メモ block on a QuickNote's detail page. Zotero search is
 * best-effort: when ZOTERO_API_KEY/ZOTERO_LIBRARY_ID aren't set (as in this
 * environment) the UI falls back to a "Zotero未設定" notice and manual
 * citation entry keeps working as the primary path.
 */
export function LiteratureMemoEditor({ noteId, note }: { noteId: string; note: QuickNoteDetail }) {
  const [citation, setCitation] = useState(note.literatureCitation ?? "");
  const [url, setUrl] = useState(note.literatureUrl ?? "");
  const [zoteroKey, setZoteroKey] = useState(note.literatureZoteroKey ?? "");
  const [summary, setSummary] = useState(note.literatureSummary ?? "");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ZoteroSearchResult[] | null>(null);
  const [zoteroState, setZoteroState] = useState<"idle" | "searching" | "unconfigured" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const handle = setTimeout(async () => {
      setZoteroState("searching");
      const res = await zoteroSearchAction(q);
      if (res.status === "ok") {
        setResults(res.results);
        setZoteroState("idle");
      } else if (res.status === "unconfigured") {
        setResults(null);
        setZoteroState("unconfigured");
      } else {
        setResults(null);
        setZoteroState("error");
        setErrorMessage(res.message);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  function pickResult(r: ZoteroSearchResult) {
    setCitation(r.citation);
    setUrl(r.url ?? "");
    setZoteroKey(r.key);
    setResults(null);
    setQuery("");
  }

  function save() {
    startTransition(async () => {
      await setLiteratureMemoAction(noteId, {
        citation: citation.trim() || null,
        url: url.trim() || null,
        zoteroKey: zoteroKey.trim() || null,
        summary: summary.trim() || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[9.5px] tracking-wider text-ink-faint uppercase">
          Zoteroライブラリを検索
        </label>
        <HudFrame active={zoteroState === "searching"} innerClassName="flex items-center gap-2 rounded-xl px-3 py-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="タイトル・著者・年で検索…"
            className="w-full bg-transparent text-xs text-ink placeholder:text-ink-soft focus:outline-none"
          />
        </HudFrame>

        {zoteroState === "unconfigured" && query.trim() && (
          <p className="font-mono text-[10.5px] text-ink-faint">
            Zotero未設定 — 手動でcitationを入力してください（ZOTERO_API_KEY / ZOTERO_LIBRARY_ID 未設定）
          </p>
        )}
        {zoteroState === "error" && <p className="font-mono text-[10.5px] text-accent">{errorMessage}</p>}

        {query.trim() && results && results.length > 0 && (
          <div className="flex flex-col gap-1 rounded-lg border border-line bg-surface-alt p-1.5">
            {results.map((r) => (
              <button
                key={r.key}
                onClick={() => pickResult(r)}
                className="rounded-md px-2.5 py-1.5 text-left text-xs text-ink transition-colors hover:bg-surface"
              >
                <span className="font-semibold">{r.title}</span>
                <span className="ml-1.5 text-ink-soft">
                  {r.creators} {r.year ? `(${r.year})` : ""}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <LabeledInput label="citation" value={citation} onChange={setCitation} placeholder="選択された文献の引用表記" />
      <LabeledInput label="URL" value={url} onChange={setUrl} placeholder="https://…" />
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[9.5px] tracking-wider text-ink-faint uppercase">本に書いてあったこと（自分の言葉で）</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
        />
      </div>

      <div className="flex justify-end">
        <button
          disabled={pending}
          onClick={save}
          className="btn-sheen rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-on-accent transition-transform hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
        >
          {pending ? "保存中…" : saved ? "保存しました" : "保存"}
        </button>
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[9.5px] tracking-wider text-ink-faint uppercase">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:border-accent focus:outline-none"
      />
    </div>
  );
}
