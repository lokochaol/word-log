"use client";

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { EmbeddedContentPreview } from "@/components/EmbeddedContentPreview";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { useRegisterUnsavedEditor } from "@/lib/unsavedChanges/UnsavedChangesProvider";

const SAVED_FLASH_MS = 2000;
const TAB_WIDTH = 4;
/** How much room to keep between the caret and the bottom of the scrollport
 * while typing, so the line being written never sits on the screen edge. */
const CARET_MARGIN_PX = 96;

/** The scrollable ancestor the textarea actually lives in — the one whose
 * scrollTop the browser clamps while the textarea is momentarily collapsed. */
function nearestScroller(el: HTMLElement): HTMLElement {
  let node = el.parentElement;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (/(auto|scroll)/.test(overflowY) && node.scrollHeight > node.clientHeight) return node;
    node = node.parentElement;
  }
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

function scrollportBottomOf(scroller: HTMLElement): number {
  if (scroller === document.scrollingElement || scroller === document.documentElement) {
    return window.innerHeight;
  }
  return scroller.getBoundingClientRect().bottom;
}

/**
 * Re-fits the textarea to its content, then makes sure the caret is still
 * comfortably on screen.
 *
 * The `height: auto` probe is what makes this delicate: it momentarily
 * collapses the textarea to one row, which shrinks the scroll container, so
 * the browser clamps scrollTop to the smaller maximum. Restoring the height
 * does NOT restore that scrollTop — which is exactly the "the view jumps up
 * and the caret ends up pinned to the bottom edge" symptom on Enter. So we
 * snapshot scrollTop and put it back ourselves.
 */
function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  const scroller = nearestScroller(el);
  const prevTop = scroller.scrollTop;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
  if (scroller.scrollTop !== prevTop) scroller.scrollTop = prevTop;
}

/**
 * Nudges the scroller so the caret's line keeps CARET_MARGIN_PX of air below
 * it. The caret's y position is derived from how many hard line breaks follow
 * it (the textarea never scrolls internally, so it's fully laid out): exact
 * when typing at the end of the document — the case that matters — and an
 * under-estimate of the scroll needed when soft-wrapped lines follow, which
 * errs on the side of not moving the view.
 */
function keepCaretInView(el: HTMLTextAreaElement | null) {
  if (!el) return;
  const style = getComputedStyle(el);
  const lineHeight = parseFloat(style.lineHeight) || 20;
  const linesAfterCaret = el.value.slice(el.selectionEnd).split("\n").length - 1;
  const caretBottom =
    el.getBoundingClientRect().bottom - parseFloat(style.paddingBottom) - linesAfterCaret * lineHeight;

  const scroller = nearestScroller(el);
  const gap = scrollportBottomOf(scroller) - caretBottom;
  if (gap < CARET_MARGIN_PX) scroller.scrollTop += CARET_MARGIN_PX - gap;
}

/** Column of the cursor within its current line (not the whole string). */
function columnOf(value: string, pos: number): number {
  return pos - (value.lastIndexOf("\n", pos - 1) + 1);
}

/** Leading whitespace of the line the cursor sits on. */
function indentOf(value: string, pos: number): string {
  const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
  return /^[ \t]*/.exec(value.slice(lineStart, pos))?.[0] ?? "";
}

/** Edits through execCommand so the browser's own undo stack survives —
 * setRangeText / setState round-trips wipe it, which makes Ctrl+Z useless
 * right after an indent or an auto-indented newline. */
function insertText(el: HTMLTextAreaElement, text: string) {
  if (!document.execCommand("insertText", false, text)) {
    const { selectionStart, selectionEnd } = el;
    el.setRangeText(text, selectionStart, selectionEnd, "end");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

function deleteRange(el: HTMLTextAreaElement, start: number, end: number) {
  el.setSelectionRange(start, end);
  if (!document.execCommand("delete")) {
    el.setRangeText("", start, end, "end");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

/**
 * A note's entire content as one plain-text/Markdown document — VSCode-style
 * rather than a list of typed blocks. ```lang fences embed code, ```mermaid
 * fences embed diagrams, and ![caption](url) embeds an image (see
 * src/lib/embeddedContent.ts); everything else is a plain paragraph.
 *
 * Saving is explicit: the Save button (or Cmd/Ctrl+S) persists, and nothing
 * else does — no autosave, no save-on-blur — so the buffer belongs to the
 * writer until they say otherwise. The flip side is that leaving with a
 * dirty buffer has to be caught, which is what the UnsavedChangesProvider
 * registration below is for: overlay closes, day switches and link
 * navigations all stop and offer 保存 / 破棄.
 *
 * Source and preview are an explicit toggle (blur used to flip to preview,
 * which meant reaching for the Save button changed the mode out from under
 * the click). Tab/Shift+Tab insert or remove soft-tab spaces aligned to the
 * next/previous 4-column stop at the cursor, and Enter carries the current
 * line's indentation — both routed through execCommand so undo still works.
 *
 * Passing `onChange` instead of `onSave` switches to live-sync mode, for
 * callers whose "save" is just local draft state (see PromotionEditor):
 * every keystroke propagates and there is no Save button or dirty tracking.
 */
export function MarkdownNoteEditor({
  content,
  onSave,
  onChange,
  savingLabelOverride,
}: {
  content: string;
  /** Persists the buffer. Rejecting leaves the editor dirty. */
  onSave?: (content: string) => void | Promise<void>;
  /** Live-sync mode: called on every keystroke, no explicit save. */
  onChange?: (content: string) => void;
  /** Overrides the "saving…" status word — e.g. an offline-aware label while
   * a save is queued waiting for connectivity. */
  savingLabelOverride?: string;
}) {
  const { t } = useI18n();
  const [value, setValue] = useState(content);
  const [savedValue, setSavedValue] = useState(content);
  const [mode, setMode] = useState<"source" | "preview">(content.trim() ? "preview" : "source");
  const [focused, setFocused] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const live = !onSave && !!onChange;
  const dirty = !live && value !== savedValue;

  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);

  useEffect(
    () => () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    },
    [],
  );

  // Both the mode flip and the focus padding change the box height, so the
  // textarea has to be re-fitted after either.
  useEffect(() => {
    if (mode === "source") autoGrow(textareaRef.current);
  }, [mode, focused]);

  function save(): Promise<void> {
    if (!onSave) return Promise.resolve();
    if (inFlightRef.current) return inFlightRef.current;
    const snapshot = valueRef.current;
    if (snapshot === savedValue) return Promise.resolve();
    setStatus("saving");
    const running = Promise.resolve(onSave(snapshot))
      .then(() => {
        setSavedValue(snapshot);
        setStatus("saved");
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setStatus("idle"), SAVED_FLASH_MS);
      })
      .catch((error: unknown) => {
        setStatus("idle");
        throw error;
      })
      .finally(() => {
        inFlightRef.current = null;
      });
    inFlightRef.current = running;
    return running;
  }

  useRegisterUnsavedEditor({
    isDirty: () => !live && valueRef.current !== savedValue,
    save,
    discard: () => setValue(savedValue),
  });

  function commit(next: string) {
    setValue(next);
    onChange?.(next);
  }

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    commit(e.target.value);
    autoGrow(e.target);
    keepCaretInView(e.target);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      void save().catch(() => {});
      return;
    }

    if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      const indent = indentOf(el.value, el.selectionStart);
      if (!indent) return; // plain newline, let the browser handle it
      e.preventDefault();
      insertText(el, `\n${indent}`);
      return;
    }

    if (e.key !== "Tab") return;
    e.preventDefault();
    const pos = el.selectionStart;
    const column = columnOf(el.value, pos);

    if (e.shiftKey) {
      if (column === 0) return;
      const removable = Math.min(column, ((column - 1) % TAB_WIDTH) + 1);
      const start = pos - removable;
      if (!/^ +$/.test(el.value.slice(start, pos))) return; // only dedent pure spaces
      deleteRange(el, start, pos);
      return;
    }

    insertText(el, " ".repeat(TAB_WIDTH - (column % TAB_WIDTH)));
  }

  function showSource() {
    setMode("source");
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  const statusLabel =
    status === "saving"
      ? (savingLabelOverride ?? t.noteEditor.savingLabel)
      : status === "saved"
        ? t.noteEditor.savedLabel
        : dirty
          ? t.noteEditor.unsavedLabel
          : null;

  return (
    <div className="flex flex-col gap-1">
      {/* Fixed height regardless of what's shown — otherwise this row popping
          in and out shifts everything below it, which reads as the whole page
          jumping around while you type. */}
      <div className="flex h-6 items-center justify-end gap-2">
        <span className="font-mono text-[9.5px] tracking-wide text-ink-faint">{statusLabel}</span>
        {!live && (
          <>
            <button
              type="button"
              onClick={() => (mode === "source" ? setMode("preview") : showSource())}
              className="rounded border border-line px-1.5 py-0.5 font-mono text-[9.5px] tracking-wide text-ink-soft uppercase transition-colors hover:bg-surface-alt"
            >
              {mode === "source" ? t.noteEditor.previewLabel : t.noteEditor.editLabel}
            </button>
            <button
              type="button"
              onClick={() => void save().catch(() => {})}
              disabled={!dirty || status === "saving"}
              className="btn-sheen rounded bg-accent px-2 py-0.5 font-mono text-[9.5px] font-semibold tracking-wide text-on-accent uppercase transition-transform hover:scale-[1.03] active:scale-[0.97] disabled:opacity-40 disabled:hover:scale-100"
            >
              {t.noteEditor.saveLabel}
            </button>
          </>
        )}
      </div>

      {mode === "source" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={t.noteEditor.placeholder}
          rows={1}
          style={{
            caretColor: "var(--color-accent)",
            tabSize: TAB_WIDTH,
            // Breathing room under the last line, only while actually being
            // typed in — it's what gives keepCaretInView somewhere to scroll
            // to when the caret is at the end of the document. Unfocused
            // editors keep their compact height (a Calendar day can show a
            // whole column of them).
            paddingBottom: focused ? CARET_MARGIN_PX : 0,
          }}
          className="w-full resize-none overflow-hidden bg-transparent font-mono text-sm leading-relaxed text-ink transition-[padding] placeholder:font-sans placeholder:text-ink-faint focus:outline-none"
        />
      ) : (
        <div onClick={showSource} className="cursor-text">
          <EmbeddedContentPreview content={value} emptyLabel={t.noteEditor.placeholder} />
        </div>
      )}
    </div>
  );
}
