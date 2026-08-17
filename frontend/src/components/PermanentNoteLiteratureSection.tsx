"use client";

import { LiteratureMemoField } from "@/components/LiteratureMemoField";
import { setPermanentNoteLiteratureAction } from "@/app/zettelkasten/actions";
import { updateLiteratureMemoSummaryAction } from "@/app/literature/actions";
import type { LiteratureMemoRef, LiteratureSelection } from "@/lib/literatureMemos";

export function PermanentNoteLiteratureSection({
  noteId,
  literatureMemo,
}: {
  noteId: string;
  literatureMemo: LiteratureMemoRef | null;
}) {
  return (
    <LiteratureMemoField
      linked={literatureMemo}
      onPick={async (selection: LiteratureSelection) => {
        const note = await setPermanentNoteLiteratureAction(noteId, selection);
        return { literatureMemo: note.literatureMemo };
      }}
      onSaveSummary={async (memoId, summary) => {
        await updateLiteratureMemoSummaryAction(memoId, summary);
      }}
    />
  );
}
