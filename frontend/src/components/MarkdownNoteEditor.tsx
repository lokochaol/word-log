"use client";

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { EmbeddedContentPreview } from "@/components/EmbeddedContentPreview";
import { useI18n } from "@/lib/i18n/LocaleProvider";

const AUTOSAVE_DELAY_MS = 1200;
const SAVED_FLASH_MS = 2000;
const TAB_WIDTH = 4;

function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

/** Column of the cursor within its current line (not the whole string). */
function columnOf(value: string, pos: number): number {
  return pos - (value.lastIndexOf("\n", pos - 1) + 1);
}

/**
 * A note's entire content as one plain-text/Markdown document — VSCode-style
 * rather than a list of typed blocks. ```lang fences embed code, ```mermaid
 * fences embed diagrams, and ![caption](url) embeds an image (see
 * src/lib/embeddedContent.ts); everything else is a plain paragraph.
 *
 * Always "live", no separate Save/Cancel: typing IS editing, and changes
 * auto-save a short pause after the last keystroke, same as the previous
 * block editor's autosave. What's new is the source/preview split — the
 * raw textarea (source) shows while focused; blurring it (with non-empty
 * content) switches to a rendered preview, and clicking that preview goes
 * back to source. Tab/Shift+Tab insert or remove soft-tab spaces aligned to
 * the next/previous 4-column stop at the cursor — not just at line start,
 * matching a plain code editor's behavior — instead of moving focus to the
 * next control.
 */
export function MarkdownNoteEditor({
  content,
  onSave,
  savingLabelOverride,
}: {
  content: string;
  onSave: (content: string) => void | Promise<void>;
  /** Overrides the "saving…" status word — e.g. an offline-aware label while
   * a save is queued waiting for connectivity. */
  savingLabelOverride?: string;
}) {
  const { t } = useI18n();
  const [value, setValue] = useState(content);
  const [editing, setEditing] = useState(!content.trim());
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (editing) autoGrow(textareaRef.current);
  }, [editing]);

  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const resaveRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    },
    [],
  );

  function runSave() {
    if (!dirtyRef.current) return;
    if (savingRef.current) {
      resaveRef.current = true;
      return;
    }
    dirtyRef.current = false;
    savingRef.current = true;
    setStatus("saving");
    Promise.resolve(onSave(valueRef.current))
      .then(() => {
        savingRef.current = false;
        if (resaveRef.current) {
          resaveRef.current = false;
          runSave();
          return;
        }
        setStatus("saved");
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setStatus("idle"), SAVED_FLASH_MS);
      })
      .catch(() => {
        savingRef.current = false;
        setStatus("idle");
      });
  }

  function scheduleSave() {
    dirtyRef.current = true;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(runSave, AUTOSAVE_DELAY_MS);
  }

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    autoGrow(e.target);
    scheduleSave();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const el = e.currentTarget;
    const pos = el.selectionStart;
    const column = columnOf(el.value, pos);

    if (e.shiftKey) {
      if (column === 0) return;
      const removable = Math.min(column, ((column - 1) % TAB_WIDTH) + 1);
      const start = pos - removable;
      if (!/^ +$/.test(el.value.slice(start, pos))) return; // only dedent pure spaces
      const next = el.value.slice(0, start) + el.value.slice(pos);
      setValue(next);
      scheduleSave();
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start;
        autoGrow(el);
      });
      return;
    }

    const insert = " ".repeat(TAB_WIDTH - (column % TAB_WIDTH));
    const next = el.value.slice(0, pos) + insert + el.value.slice(pos);
    setValue(next);
    scheduleSave();
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = pos + insert.length;
      autoGrow(el);
    });
  }

  function handleBlur() {
    if (value.trim()) setEditing(false);
  }

  function startEditing() {
    setEditing(true);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  const statusLabel =
    status === "saving" ? (savingLabelOverride ?? t.noteEditor.savingLabel) : status === "saved" ? t.noteEditor.savedLabel : null;

  return (
    <div className="flex flex-col gap-1">
      {/* Fixed height regardless of whether statusLabel is shown — otherwise
          this row's height popping in/out on every save cycle (idle ->
          saving -> saved -> idle) shifts everything below it, which reads as
          the whole page jumping each time a save fires. */}
      <div className="flex h-3.5 justify-end">
        <span className="font-mono text-[9.5px] tracking-wide text-ink-faint">{statusLabel}</span>
      </div>

      {editing ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={t.noteEditor.placeholder}
          rows={1}
          style={{ caretColor: "var(--color-accent)", tabSize: TAB_WIDTH }}
          className="w-full resize-none overflow-hidden bg-transparent font-mono text-sm leading-relaxed text-ink placeholder:font-sans placeholder:text-ink-faint focus:outline-none"
        />
      ) : (
        <div onClick={startEditing} className="cursor-text">
          <EmbeddedContentPreview content={value} emptyLabel={t.noteEditor.placeholder} />
        </div>
      )}
    </div>
  );
}
