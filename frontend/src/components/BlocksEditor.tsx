"use client";

import { useState } from "react";
import type { Block, BlockInput, BlockType } from "@/lib/quickNotes";
import { MermaidPreview } from "@/components/MermaidPreview";
import { HudFrame } from "@/components/HudFrame";

type EditableBlock = BlockInput & { key: string };

const BLOCK_LABELS: Record<BlockType, string> = {
  TEXT: "TEXT",
  CODE: "CODE",
  MERMAID: "MERMAID",
  IMAGE: "IMAGE",
};

function toEditable(blocks: Block[]): EditableBlock[] {
  return blocks.map((b) => ({
    key: b.id,
    type: b.type,
    content: b.content,
    language: b.language,
    caption: b.caption,
  }));
}

function emptyBlock(type: BlockType): EditableBlock {
  return { key: crypto.randomUUID(), type, content: "", language: type === "CODE" ? "" : null, caption: null };
}

function BlockTag({ type }: { type: BlockType }) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[9px] tracking-widest text-accent">
      <span aria-hidden="true">[</span>
      {BLOCK_LABELS[type]}
      <span aria-hidden="true">]</span>
    </span>
  );
}

/**
 * The generalized TEXT/CODE/MERMAID/IMAGE block editor, extracted from the
 * original MeaningBlocksEditor so QuickNote (走り書き), PermanentNote drafts
 * (昇格 editor), and PermanentNoteBlock editing can all share it. Persistence
 * is entirely up to the caller via `onSave` — for QuickNote/PermanentNote
 * detail pages that's a Server Action, for PromotionEditor drafts it's just
 * local state (nothing is sent to the server until 完了).
 */
export function BlocksEditor({
  blocks,
  onSave,
  saving = false,
  emptyLabel = "＋ ブロックを追加",
  startInEditMode = false,
}: {
  blocks: Block[];
  onSave: (blocks: BlockInput[]) => void | Promise<void>;
  saving?: boolean;
  emptyLabel?: string;
  startInEditMode?: boolean;
}) {
  const [editing, setEditing] = useState(startInEditMode);
  const [draft, setDraft] = useState<EditableBlock[]>(() => toEditable(blocks));
  const [emptyHover, setEmptyHover] = useState(false);

  function startEditing() {
    setDraft(toEditable(blocks));
    setEditing(true);
  }

  async function save() {
    const payload: BlockInput[] = draft
      .filter((b) => b.content.trim())
      .map((b) => ({ type: b.type, content: b.content.trim(), language: b.language || null, caption: b.caption || null }));
    await onSave(payload);
    setEditing(false);
  }

  if (!editing) {
    if (blocks.length === 0) {
      return (
        <button
          onClick={startEditing}
          onMouseEnter={() => setEmptyHover(true)}
          onMouseLeave={() => setEmptyHover(false)}
          onFocus={() => setEmptyHover(true)}
          onBlur={() => setEmptyHover(false)}
          className="w-full text-left"
        >
          <HudFrame
            active={emptyHover}
            innerClassName="flex items-center justify-center rounded-xl py-6 font-mono text-sm font-semibold text-accent"
          >
            {emptyLabel}
          </HudFrame>
        </button>
      );
    }
    return (
      <div className="flex flex-col gap-3">
        {blocks.map((block) => (
          <BlockView key={block.id} block={block} />
        ))}
        <button
          onClick={startEditing}
          className="self-start font-mono text-xs font-medium text-ink-soft transition-colors hover:text-accent"
        >
          <span className="text-accent">&gt;</span> 編集する
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {draft.map((block, i) => (
        <BlockEditRow
          key={block.key}
          block={block}
          onChange={(next) => setDraft((prev) => prev.map((b, idx) => (idx === i ? next : b)))}
          onRemove={() => setDraft((prev) => prev.filter((_, idx) => idx !== i))}
        />
      ))}

      <div className="flex flex-wrap gap-2">
        {(["TEXT", "CODE", "MERMAID", "IMAGE"] as BlockType[]).map((type) => (
          <button
            key={type}
            onClick={() => setDraft((prev) => [...prev, emptyBlock(type)])}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 font-mono text-xs font-semibold tracking-wide text-ink-soft transition-all duration-200 hover:border-accent hover:text-accent hover:shadow-[0_0_16px_-6px_var(--color-accent)]"
          >
            + {{ TEXT: "テキスト", CODE: "コード", MERMAID: "Mermaid図", IMAGE: "画像" }[type]}
          </button>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setEditing(false)}
          className="rounded-lg border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-surface-alt"
        >
          キャンセル
        </button>
        <button
          disabled={saving}
          onClick={save}
          className="btn-sheen rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-on-accent transition-transform hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
        >
          {saving ? "保存中…" : "保存"}
        </button>
      </div>
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <HudFrame active={hovered} innerClassName="flex flex-col gap-2 rounded-xl px-4 py-4">
        <BlockTag type={block.type} />
        {block.type === "TEXT" && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{block.content}</p>
        )}
        {block.type === "CODE" && (
          <div className="rounded-md bg-surface-alt p-3">
            {block.language && <p className="mb-1.5 font-mono text-[10px] text-ink-soft">{block.language}</p>}
            <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-ink">{block.content}</pre>
          </div>
        )}
        {block.type === "MERMAID" && <MermaidPreview source={block.content} />}
        {block.type === "IMAGE" && (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={block.content} alt={block.caption ?? ""} className="h-20 w-20 rounded-md object-cover" />
            {block.caption && <p className="text-xs text-ink-soft">{block.caption}</p>}
          </div>
        )}
      </HudFrame>
    </div>
  );
}

function BlockEditRow({
  block,
  onChange,
  onRemove,
}: {
  block: EditableBlock;
  onChange: (b: EditableBlock) => void;
  onRemove: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
      <HudFrame active={focused} innerClassName="flex flex-col gap-3 rounded-xl px-4 py-4">
        <div className="flex items-center justify-between">
          <BlockTag type={block.type} />
          <button onClick={onRemove} className="font-mono text-[10px] text-ink-soft transition-colors hover:text-accent">
            削除
          </button>
        </div>

        {block.type === "TEXT" && (
          <textarea
            autoFocus
            value={block.content}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
            rows={3}
            placeholder="自分の言葉での内容、出会った文脈のメモなど"
            style={{ caretColor: "var(--color-accent)" }}
            className="w-full resize-none rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
          />
        )}

        {block.type === "CODE" && (
          <div className="flex flex-col gap-2">
            <input
              value={block.language ?? ""}
              onChange={(e) => onChange({ ...block, language: e.target.value })}
              placeholder="言語（例: javascript）"
              className="w-40 rounded-md border border-line bg-surface px-3 py-1.5 font-mono text-xs text-ink focus:border-accent focus:outline-none"
            />
            <textarea
              value={block.content}
              onChange={(e) => onChange({ ...block, content: e.target.value })}
              rows={4}
              placeholder="出会った文脈のコード片"
              style={{ caretColor: "var(--color-accent)" }}
              className="w-full resize-none rounded-md border border-line bg-surface-alt px-3 py-2 font-mono text-xs text-ink focus:border-accent focus:outline-none"
            />
          </div>
        )}

        {block.type === "MERMAID" && (
          <div className="flex flex-col gap-2">
            <textarea
              value={block.content}
              onChange={(e) => onChange({ ...block, content: e.target.value })}
              rows={4}
              placeholder={"graph LR\n  ephemeral --> transient"}
              style={{ caretColor: "var(--color-accent)" }}
              className="w-full resize-none rounded-md border border-line bg-surface-alt px-3 py-2 font-mono text-xs text-ink focus:border-accent focus:outline-none"
            />
            <MermaidPreview source={block.content} />
          </div>
        )}

        {block.type === "IMAGE" && (
          <div className="flex flex-col gap-2">
            <input
              value={block.content}
              onChange={(e) => onChange({ ...block, content: e.target.value })}
              placeholder="画像URL"
              className="w-full rounded-md border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:border-accent focus:outline-none"
            />
            <input
              value={block.caption ?? ""}
              onChange={(e) => onChange({ ...block, caption: e.target.value })}
              placeholder="キャプション（任意）"
              className="w-full rounded-md border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:border-accent focus:outline-none"
            />
          </div>
        )}
      </HudFrame>
    </div>
  );
}
