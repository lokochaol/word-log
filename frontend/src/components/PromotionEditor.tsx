"use client";

import { useState, type ReactNode } from "react";
import { BlocksEditor } from "@/components/BlocksEditor";
import { LiteratureMemoDraftField, type DraftLiteratureSelection } from "@/components/LiteratureMemoDraftField";
import type { BlockInput } from "@/lib/blocks";
import type { GlobalOrderEntry } from "@/lib/permanentNotes";
import type { IndexEntrySummary } from "@/lib/indexEntries";
import { validateDraft, type PermanentNoteDraft } from "@/lib/promotionValidation";

export interface EditableLink {
  clientId: string;
  relationLabel: string;
  target: { type: "PERMANENT_NOTE"; noteId: string; label: string } | { type: "INDEX_ENTRY"; indexEntryId: string; label: string };
}

export interface EditableDraft {
  clientId: string;
  title: string;
  blocks: BlockInput[];
  links: EditableLink[];
  gap: { beforeId: string | null; afterId: string | null } | null;
  orderKey: string | null;
  literature?: DraftLiteratureSelection;
}

function toDraftForValidation(d: EditableDraft): PermanentNoteDraft {
  return {
    title: d.title,
    blocks: d.blocks,
    links: d.links.map((l) => ({ relationLabel: l.relationLabel, target: l.target })),
    orderKey: d.orderKey,
    literature: d.literature,
  };
}

function gapLabel(gap: EditableDraft["gap"], globalOrder: GlobalOrderEntry[]): string {
  if (!gap) return "未選択";
  const beforeTitle = gap.beforeId ? (globalOrder.find((n) => n.id === gap.beforeId)?.title ?? "?") : "先頭";
  const afterTitle = gap.afterId ? (globalOrder.find((n) => n.id === gap.afterId)?.title ?? "?") : "末尾";
  return `${beforeTitle} と ${afterTitle} の間`;
}

export function PromotionEditor({
  drafts,
  onChangeDrafts,
  activeDraftId,
  onSetActiveDraftId,
  indexEntries,
  globalOrder,
  onComplete,
  completing,
  completeError,
}: {
  drafts: EditableDraft[];
  onChangeDrafts: (drafts: EditableDraft[]) => void;
  activeDraftId: string | null;
  onSetActiveDraftId: (id: string | null) => void;
  indexEntries: IndexEntrySummary[];
  globalOrder: GlobalOrderEntry[];
  onComplete: () => void;
  completing: boolean;
  completeError: string | null;
}) {
  function updateDraft(clientId: string, patch: Partial<EditableDraft>) {
    onChangeDrafts(drafts.map((d) => (d.clientId === clientId ? { ...d, ...patch } : d)));
  }

  function addDraft() {
    onChangeDrafts([
      ...drafts,
      { clientId: crypto.randomUUID(), title: "", blocks: [], links: [], gap: null, orderKey: null, literature: undefined },
    ]);
  }

  function removeDraft(clientId: string) {
    onChangeDrafts(drafts.filter((d) => d.clientId !== clientId));
    if (activeDraftId === clientId) onSetActiveDraftId(null);
  }

  const problemsByDraft = new Map(drafts.map((d) => [d.clientId, validateDraft(toDraftForValidation(d))]));
  const incompleteCount = drafts.filter((d) => (problemsByDraft.get(d.clientId)?.length ?? 0) > 0).length;
  const allValid = drafts.length > 0 && incompleteCount === 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3 font-mono text-[10px] tracking-wider text-ink-faint uppercase">
        <span className="text-accent">②</span> 永久保存版メモ作成 — {drafts.length}件
      </div>

      <div className="flex-1 overflow-auto p-4">
        {drafts.length === 0 && (
          <p className="py-8 text-center text-xs text-ink-soft">
            右側の走り書きから選択したら、ここでドラフトを作成します。
          </p>
        )}

        <div className="flex flex-col gap-3">
          {drafts.map((draft, i) => {
            const problems = problemsByDraft.get(draft.clientId) ?? [];
            return (
              <DraftCard
                key={draft.clientId}
                index={i + 1}
                draft={draft}
                problems={problems}
                isPickingPosition={activeDraftId === draft.clientId}
                indexEntries={indexEntries}
                globalOrder={globalOrder}
                onChange={(patch) => updateDraft(draft.clientId, patch)}
                onRemove={() => removeDraft(draft.clientId)}
                onTogglePositionPicker={() =>
                  onSetActiveDraftId(activeDraftId === draft.clientId ? null : draft.clientId)
                }
              />
            );
          })}
        </div>

        <button
          onClick={addDraft}
          className="mt-3 w-full rounded-lg border border-dashed border-line px-3 py-2.5 text-center text-xs text-ink-soft transition-colors hover:border-accent hover:text-accent"
        >
          ＋ もう一件ドラフトを追加
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-alt px-4 py-3">
        <span className="font-mono text-[10px] text-ink-faint">
          {drafts.length === 0
            ? "ドラフトがありません"
            : incompleteCount > 0
              ? `${drafts.length}件中 ${incompleteCount}件が未入力`
              : "すべて入力済み"}
        </span>
        {completeError && <span className="font-mono text-[10px] text-accent">{completeError}</span>}
        <button
          disabled={!allValid || completing}
          onClick={onComplete}
          className="btn-sheen shrink-0 rounded-lg bg-accent px-4 py-2.5 text-xs font-bold text-on-accent transition-transform hover:scale-[1.03] active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink-faint disabled:hover:scale-100"
        >
          {completing ? "保存中…" : "完了 — 走り書きから削除して保存"}
        </button>
      </div>
    </div>
  );
}

function DraftCard({
  index,
  draft,
  problems,
  isPickingPosition,
  indexEntries,
  globalOrder,
  onChange,
  onRemove,
  onTogglePositionPicker,
}: {
  index: number;
  draft: EditableDraft;
  problems: string[];
  isPickingPosition: boolean;
  indexEntries: IndexEntrySummary[];
  globalOrder: GlobalOrderEntry[];
  onChange: (patch: Partial<EditableDraft>) => void;
  onRemove: () => void;
  onTogglePositionPicker: () => void;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface-alt p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-xs font-bold text-ink">
          <span className="font-mono text-accent">{String(index).padStart(2, "0")}</span>
        </h4>
        <button onClick={onRemove} className="font-mono text-[10px] text-ink-soft hover:text-accent">
          削除
        </button>
      </div>

      <Field label="タイトル" filled={!!draft.title.trim()}>
        <input
          value={draft.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="一行で要約するタイトル"
          className="w-full bg-transparent text-sm font-bold text-ink placeholder:font-normal placeholder:text-ink-soft focus:outline-none"
        />
      </Field>

      <div className="mt-2.5">
        <label className="mb-1.5 block font-mono text-[9.5px] tracking-wider text-ink-faint uppercase">内容</label>
        <BlocksEditor
          blocks={draft.blocks.map((b, i) => ({
            id: `draft-${i}`,
            type: b.type,
            content: b.content,
            language: b.language ?? null,
            caption: b.caption ?? null,
          }))}
          onSave={(blocks) => onChange({ blocks })}
          emptyLabel="＋ 内容を入力"
          startInEditMode={draft.blocks.length === 0}
        />
      </div>

      <div className="mt-2.5">
        <LinkPicker
          links={draft.links}
          indexEntries={indexEntries}
          globalOrder={globalOrder}
          onChange={(links) => onChange({ links })}
        />
      </div>

      <div className="mt-2.5">
        <label className="mb-1.5 block font-mono text-[9.5px] tracking-wider text-ink-faint uppercase">文献メモ（任意）</label>
        <LiteratureMemoDraftField
          selection={draft.literature}
          onChange={(literature) => onChange({ literature })}
        />
      </div>

      <Field label="保存位置" filled={!!draft.orderKey} onClick={onTogglePositionPicker}>
        <span className="flex items-center justify-between">
          {gapLabel(draft.gap, globalOrder)}
          <span className="font-mono text-[10px] text-ink-faint">
            {isPickingPosition ? "選択中 ▾" : "変更 ▸"}
          </span>
        </span>
      </Field>

      {problems.length > 0 && (
        <p className="mt-2 font-mono text-[9.5px] text-accent">{problems.join(" / ")}</p>
      )}
    </div>
  );
}

function Field({
  label,
  filled,
  onClick,
  children,
}: {
  label: string;
  filled: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="mt-2.5">
      <label className="mb-1.5 block font-mono text-[9.5px] tracking-wider text-ink-faint uppercase">{label}</label>
      <div
        onClick={onClick}
        className={`min-h-8 rounded-md border px-2.5 py-2 text-[11.5px] ${
          filled ? "border-line text-ink" : "border-accent/50 text-accent"
        } ${onClick ? "cursor-pointer" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

function LinkPicker({
  links,
  indexEntries,
  globalOrder,
  onChange,
}: {
  links: EditableLink[];
  indexEntries: IndexEntrySummary[];
  globalOrder: GlobalOrderEntry[];
  onChange: (links: EditableLink[]) => void;
}) {
  const [kind, setKind] = useState<"INDEX_ENTRY" | "PERMANENT_NOTE">("INDEX_ENTRY");
  const [targetId, setTargetId] = useState("");
  const [relationLabel, setRelationLabel] = useState("");

  function addLink() {
    if (!targetId || !relationLabel.trim()) return;
    if (kind === "INDEX_ENTRY") {
      const entry = indexEntries.find((e) => e.id === targetId);
      if (!entry) return;
      onChange([
        ...links,
        {
          clientId: crypto.randomUUID(),
          relationLabel: relationLabel.trim(),
          target: { type: "INDEX_ENTRY", indexEntryId: entry.id, label: entry.keyword },
        },
      ]);
    } else {
      const note = globalOrder.find((n) => n.id === targetId);
      if (!note) return;
      onChange([
        ...links,
        {
          clientId: crypto.randomUUID(),
          relationLabel: relationLabel.trim(),
          target: { type: "PERMANENT_NOTE", noteId: note.id, label: note.title },
        },
      ]);
    }
    setTargetId("");
    setRelationLabel("");
  }

  return (
    <div>
      <label className="mb-1.5 block font-mono text-[9.5px] tracking-wider text-ink-faint uppercase">
        リンク（1件以上）
      </label>

      {links.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {links.map((l) => (
            <span
              key={l.clientId}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-2.5 py-1 font-mono text-[10px] text-accent"
            >
              <b className="font-bold">{l.relationLabel}</b>
              <span className="text-ink-soft">／ {l.target.type === "INDEX_ENTRY" ? "索引" : "メモ"}: {l.target.label}</span>
              <button
                onClick={() => onChange(links.filter((x) => x.clientId !== l.clientId))}
                className="opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <select
          value={kind}
          onChange={(e) => {
            setKind(e.target.value as typeof kind);
            setTargetId("");
          }}
          className="rounded-md border border-line bg-surface px-1.5 py-1 text-[10.5px] text-ink"
        >
          <option value="INDEX_ENTRY">索引</option>
          <option value="PERMANENT_NOTE">メモ</option>
        </select>
        <select
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-line bg-surface px-1.5 py-1 text-[10.5px] text-ink"
        >
          <option value="">リンク先を選ぶ…</option>
          {(kind === "INDEX_ENTRY" ? indexEntries : globalOrder).map((opt) => (
            <option key={opt.id} value={opt.id}>
              {"keyword" in opt ? opt.keyword : opt.title}
            </option>
          ))}
        </select>
        <input
          value={relationLabel}
          onChange={(e) => setRelationLabel(e.target.value)}
          placeholder="関係性を一言で（例: 応用元）"
          className="min-w-0 flex-1 rounded-md border border-line bg-surface px-2 py-1 text-[10.5px] text-ink placeholder:text-ink-faint"
        />
        <button
          onClick={addLink}
          disabled={!targetId || !relationLabel.trim()}
          className="rounded-md border border-line px-2 py-1 font-mono text-[10px] text-ink-soft transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
        >
          ＋追加
        </button>
      </div>
    </div>
  );
}
