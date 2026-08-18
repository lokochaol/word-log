"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { NoteTimeline } from "@/components/NoteTimeline";
import { AddLiteratureMemoButton } from "@/components/AddLiteratureMemoButton";
import { LoadingBlock, Spinner } from "@/components/LoadingSpinner";
import {
  getLiteratureMemoDetailAction,
  listLiteratureMemosAction,
  removeLiteratureMemoAction,
  updateLiteratureMemoDetailsAction,
} from "@/app/literature/actions";
import type { LiteratureMemoDetail, LiteratureMemoSummary } from "@/lib/literatureMemos";

/**
 * Inline 文献メモ browser for ①'s pane — the main use case is a quick
 * lookup/confirmation while linking a note, not a destination in itself, so
 * this stays entirely inside the column (list → detail → back) rather than
 * navigating away. The standalone /literature and /literature/[id] routes
 * still exist for direct deep links.
 */
export function LiteratureMemoPane({
  onOpenPermanentNote,
}: {
  onOpenPermanentNote: (id: string) => void;
}) {
  const [memos, setMemos] = useState<LiteratureMemoSummary[] | null>(null);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    listLiteratureMemosAction().then(setMemos);
  }, []);

  function handleRemoved(id: string) {
    setMemos((prev) => prev?.filter((m) => m.id !== id) ?? prev);
    setOpenId(null);
  }

  function handleUpdated(updated: LiteratureMemoDetail) {
    setMemos((prev) =>
      prev?.map((m) =>
        m.id === updated.id ? { ...m, citation: updated.citation, url: updated.url, summary: updated.summary } : m,
      ) ?? prev,
    );
  }

  function handleCreated(memo: LiteratureMemoDetail) {
    setMemos((prev) => [
      ...(prev ?? []),
      {
        id: memo.id,
        zoteroKey: memo.zoteroKey,
        citation: memo.citation,
        url: memo.url,
        summary: memo.summary,
        quickNoteCount: 0,
        permanentNoteCount: 0,
        updatedAt: memo.updatedAt,
      },
    ]);
    setOpenId(memo.id);
  }

  if (openId) {
    return (
      <LiteratureMemoPaneDetail
        id={openId}
        onBack={() => setOpenId(null)}
        onRemoved={handleRemoved}
        onUpdated={handleUpdated}
        onOpenPermanentNote={onOpenPermanentNote}
      />
    );
  }

  const filtered = (memos ?? []).filter((m) => m.citation.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-3 p-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="citationで絞り込み…"
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none"
      />

      {memos === null ? (
        <LoadingBlock label="読み込み中…" size="md" />
      ) : (
        <NoteTimeline
          emptyLabel={memos.length === 0 ? "まだ文献メモがありません。" : "一致する文献メモが見つかりません。"}
          rows={filtered.map((m) => ({
            key: m.id,
            meta: (
              <span className="font-mono text-[9px] text-ink-faint">
                {new Date(m.updatedAt).toLocaleDateString("ja-JP")}
                {m.zoteroKey && <span className="ml-1.5 text-accent">Zotero</span>}
              </span>
            ),
            card: (
              <button
                onClick={() => setOpenId(m.id)}
                className="flex w-full max-w-[320px] flex-col gap-1.5 rounded-lg border border-line bg-surface-alt p-3 text-left transition-colors hover:border-accent/60"
              >
                <p className="text-xs font-semibold text-ink">{m.citation}</p>
                {m.summary && <p className="line-clamp-1 text-[11px] text-ink-soft">{m.summary}</p>}
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-full border border-line-strong px-1.5 py-0.5 font-mono text-[9px] text-ink-soft">
                    走り書き {m.quickNoteCount}
                  </span>
                  <span
                    className={`rounded-full border border-line-strong px-1.5 py-0.5 font-mono text-[9px] text-ink-soft ${
                      m.permanentNoteCount === 0 ? "opacity-40" : ""
                    }`}
                  >
                    永久保存版 {m.permanentNoteCount}
                  </span>
                </div>
              </button>
            ),
          }))}
        />
      )}

      <AddLiteratureMemoButton onCreated={handleCreated} />
    </div>
  );
}

function LiteratureMemoPaneDetail({
  id,
  onBack,
  onRemoved,
  onUpdated,
  onOpenPermanentNote,
}: {
  id: string;
  onBack: () => void;
  onRemoved: (id: string) => void;
  onUpdated: (detail: LiteratureMemoDetail) => void;
  onOpenPermanentNote: (id: string) => void;
}) {
  const [detail, setDetail] = useState<LiteratureMemoDetail | null>(null);
  const [citation, setCitation] = useState("");
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [savePending, startSaveTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    getLiteratureMemoDetailAction(id).then((d) => {
      if (cancelled) return;
      setDetail(d);
      setCitation(d.citation);
      setUrl(d.url ?? "");
      setSummary(d.summary ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  function save() {
    if (!detail) return;
    startSaveTransition(async () => {
      const updated = await updateLiteratureMemoDetailsAction(detail.id, {
        citation,
        url: url.trim() || null,
        summary,
      });
      setDetail(updated);
      setCitation(updated.citation);
      onUpdated(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  function remove() {
    if (!detail) return;
    startDeleteTransition(async () => {
      await removeLiteratureMemoAction(detail.id);
      onRemoved(detail.id);
    });
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <button onClick={onBack} className="w-fit font-mono text-[10.5px] text-ink-soft transition-colors hover:text-accent">
        <span className="text-accent">&lt;</span> 一覧へ戻る
      </button>

      {!detail ? (
        <LoadingBlock label="読み込み中…" size="md" />
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[9.5px] tracking-[0.15em] text-accent uppercase">
              文献メモ{detail.zoteroKey && <span className="ml-1.5 text-ink-soft">（Zotero連携）</span>}
            </p>
            <input
              value={citation}
              onChange={(e) => setCitation(e.target.value)}
              placeholder="citation"
              className="w-full rounded-md border border-line bg-surface-alt px-2.5 py-1.5 text-sm font-bold text-ink focus:border-accent focus:outline-none"
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="URL（任意）"
              className="w-full rounded-md border border-line bg-surface-alt px-2.5 py-1.5 font-mono text-[10.5px] text-ink-soft focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[9px] tracking-wider text-ink-faint uppercase">
              自分の言葉で（共有・全参照元に反映）
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border border-line bg-surface-alt px-2.5 py-2 text-xs text-ink focus:border-accent focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                disabled={savePending || !citation.trim()}
                onClick={save}
                className="btn-sheen flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 font-mono text-[10.5px] font-semibold text-on-accent disabled:opacity-50"
              >
                {savePending && <Spinner size="xs" />}
                {savePending ? "保存中…" : saved ? "保存しました" : "保存"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[9px] tracking-wider text-ink-faint uppercase">
              永久保存版メモ（{detail.permanentNotes.length}件）
            </label>
            {detail.permanentNotes.length === 0 ? (
              <p className="font-mono text-[10.5px] text-ink-faint">まだありません。</p>
            ) : (
              detail.permanentNotes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => onOpenPermanentNote(n.id)}
                  className="rounded-md border border-line bg-surface-alt px-2.5 py-1.5 text-left text-[11.5px] text-ink transition-colors hover:border-accent/60"
                >
                  {n.title}
                </button>
              ))
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[9px] tracking-wider text-ink-faint uppercase">
              走り書き（{detail.quickNotes.length}件）
            </label>
            {detail.quickNotes.length === 0 ? (
              <p className="font-mono text-[10.5px] text-ink-faint">まだありません。</p>
            ) : (
              detail.quickNotes.map((n) => (
                <Link
                  key={n.id}
                  href={`/scratch/${n.id}`}
                  className="rounded-md border border-line bg-surface-alt px-2.5 py-1.5 text-[11.5px] text-ink transition-colors hover:border-accent/60"
                >
                  {n.preview || "(内容未記入)"}
                </Link>
              ))
            )}
          </div>

          <div className="flex justify-end border-t border-line pt-3">
            <button
              onClick={() => setConfirmOpen(true)}
              className="font-mono text-[10.5px] text-ink-soft transition-colors hover:text-accent"
            >
              この文献メモを削除
            </button>
          </div>

          <ConfirmDialog
            open={confirmOpen}
            title="文献メモを削除しますか？"
            warning={`参照している走り書き${detail.quickNotes.length}件・永久保存版メモ${detail.permanentNotes.length}件からのリンクも解除されます（各ノート自体は削除されません）。`}
            confirmLabel="削除"
            onCancel={() => setConfirmOpen(false)}
            onConfirm={remove}
            confirmDisabled={deletePending}
            confirmPending={deletePending}
          />
        </>
      )}
    </div>
  );
}
