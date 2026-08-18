"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Spinner } from "@/components/LoadingSpinner";
import { removeLiteratureMemoAction, updateLiteratureMemoDetailsAction } from "@/app/literature/actions";
import type { LiteratureMemoDetail as LiteratureMemoDetailType } from "@/lib/literatureMemos";

export function LiteratureMemoDetail({ initialDetail }: { initialDetail: LiteratureMemoDetailType }) {
  const router = useRouter();
  const [detail, setDetail] = useState(initialDetail);
  const [citation, setCitation] = useState(initialDetail.citation);
  const [url, setUrl] = useState(initialDetail.url ?? "");
  const [summary, setSummary] = useState(initialDetail.summary ?? "");
  const [savePending, startSaveTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();

  function save() {
    startSaveTransition(async () => {
      const updated = await updateLiteratureMemoDetailsAction(detail.id, {
        citation,
        url: url.trim() || null,
        summary,
      });
      setDetail(updated);
      setCitation(updated.citation);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  function remove() {
    startDeleteTransition(async () => {
      await removeLiteratureMemoAction(detail.id);
      router.push("/literature");
    });
  }

  return (
    <div className="relative flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">
          文献メモ{detail.zoteroKey && <span className="ml-2 text-ink-soft">（Zotero連携）</span>}
        </p>
        <input
          value={citation}
          onChange={(e) => setCitation(e.target.value)}
          placeholder="citation"
          className="w-full rounded-lg border border-line bg-surface-alt px-3 py-2 text-2xl font-extrabold tracking-tight text-ink focus:border-accent focus:outline-none"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL（任意）"
          className="w-full rounded-lg border border-line bg-surface-alt px-3 py-1.5 font-mono text-xs text-ink-soft focus:border-accent focus:outline-none"
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-[10.5px] font-semibold tracking-[0.2em] text-ink-soft uppercase">
          <span className="text-accent">{"//"}</span> 文献に書いてあったこと（自分の言葉で）
        </h2>
        <p className="font-mono text-[10px] text-ink-faint">
          この要約は、このメモを参照する全ての走り書き・永久保存版メモで共有されます。
        </p>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={5}
          className="w-full resize-none rounded-lg border border-line bg-surface-alt px-3 py-2.5 text-sm text-ink focus:border-accent focus:outline-none"
        />
        <div className="flex justify-end">
          <button
            disabled={savePending || !citation.trim()}
            onClick={save}
            className="btn-sheen flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-on-accent transition-transform hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
          >
            {savePending && <Spinner size="xs" />}
            {savePending ? "保存中…" : saved ? "保存しました" : "保存"}
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-[10.5px] font-semibold tracking-[0.2em] text-ink-soft uppercase">
          <span className="text-accent">{"//"}</span> 参照している永久保存版メモ（{detail.permanentNotes.length}件）
        </h2>
        {detail.permanentNotes.length === 0 ? (
          <p className="font-mono text-xs text-ink-soft">まだありません。</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {detail.permanentNotes.map((n) => (
              <Link
                key={n.id}
                href={`/zettelkasten?open=${n.id}`}
                className="rounded-lg border border-line bg-surface-alt px-3 py-2 text-sm text-ink transition-colors hover:border-accent/60"
              >
                {n.title}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-[10.5px] font-semibold tracking-[0.2em] text-ink-soft uppercase">
          <span className="text-accent">{"//"}</span> 参照している走り書き（{detail.quickNotes.length}件）
        </h2>
        {detail.quickNotes.length === 0 ? (
          <p className="font-mono text-xs text-ink-soft">まだありません。</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {detail.quickNotes.map((n) => (
              <Link
                key={n.id}
                href={`/scratch/${n.id}`}
                className="rounded-lg border border-line bg-surface-alt px-3 py-2 text-sm text-ink transition-colors hover:border-accent/60"
              >
                {n.preview || "(内容未記入)"}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="flex justify-end border-t border-line pt-5">
        <button
          onClick={() => setConfirmOpen(true)}
          className="font-mono text-[10.5px] text-ink-soft transition-colors hover:text-accent"
        >
          この文献メモを削除
        </button>
      </section>

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
    </div>
  );
}
