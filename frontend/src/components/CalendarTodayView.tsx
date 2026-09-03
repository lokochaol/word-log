"use client";

import { MarkdownNoteEditor } from "@/components/MarkdownNoteEditor";
import { HudFrame } from "@/components/HudFrame";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { upsertCalendarTaskNoteAction } from "@/app/calendar/actions";
import type { TodayProjectNote } from "@/lib/projectTaskNotes";

/** ③カレンダー・今日 — every active project's task note for today, all shown
 * fully expanded and editable at once (never a summarized/collapsed list),
 * per spec: "省略した一覧表示ではなく、編集可能な開いた状態で、すべて表示する". */
export function CalendarTodayView({ heading, initialNotes }: { heading: string; initialNotes: TodayProjectNote[] }) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-mono text-[10.5px] font-semibold tracking-[0.2em] text-ink-soft uppercase">
        <span className="text-accent">{"//"}</span> {heading}
      </h2>
      {initialNotes.map((note) => (
        <HudFrame key={note.projectId} active={false} innerClassName="flex flex-col gap-2 rounded-xl px-4 py-3.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-ink">{note.projectName}</span>
            {note.isDefault && (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[9px] tracking-wider text-accent uppercase">
                {t.projects.defaultBadge}
              </span>
            )}
          </div>
          <MarkdownNoteEditor
            content={note.content}
            onSave={async (content) => {
              await upsertCalendarTaskNoteAction(note.projectId, todayKeyValue(), content);
            }}
          />
        </HudFrame>
      ))}
    </div>
  );
}

function todayKeyValue() {
  return new Date().toISOString().slice(0, 10);
}
