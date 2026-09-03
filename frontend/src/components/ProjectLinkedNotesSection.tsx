import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/types";
import type { LinkedPermanentNoteRef, LinkedQuickNoteRef } from "@/lib/projects";

/** "またdash-off, 永久保存版メモに保存されたプロジェクトに関連付けられたメモ
 * を一覧表示する" — every QuickNote/PermanentNote ever linked to this
 * project, both still-active and (for QuickNote) archived-by-project-close. */
export function ProjectLinkedNotesSection({
  quickNotes,
  permanentNotes,
  locale,
}: {
  quickNotes: LinkedQuickNoteRef[];
  permanentNotes: LinkedPermanentNoteRef[];
  locale: Locale;
}) {
  const t = getDictionary(locale);
  const isEmpty = quickNotes.length === 0 && permanentNotes.length === 0;

  return (
    <div className="flex flex-col gap-4">
      {isEmpty && <p className="text-sm text-ink-soft">{t.projects.noLinkedNotes}</p>}

      {quickNotes.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="font-mono text-[10px] font-semibold tracking-[0.15em] text-ink-soft uppercase">
            {t.projects.linkedQuickNotesHeading(quickNotes.length)}
          </h3>
          <div className="flex flex-col gap-1.5">
            {quickNotes.map((note) => (
              <Link
                key={note.id}
                href={`/scratch/${note.id}`}
                className="truncate rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink transition-colors hover:border-accent"
              >
                {note.preview || t.common.noContent}
                {note.status === "ARCHIVED" && <span className="ml-2 text-ink-faint">{t.projects.archivedSuffix}</span>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {permanentNotes.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="font-mono text-[10px] font-semibold tracking-[0.15em] text-ink-soft uppercase">
            {t.projects.linkedPermanentNotesHeading(permanentNotes.length)}
          </h3>
          <div className="flex flex-col gap-1.5">
            {permanentNotes.map((note) => (
              <Link
                key={note.id}
                href={`/zettelkasten?open=${note.id}`}
                className="truncate rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink transition-colors hover:border-accent"
              >
                {note.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
