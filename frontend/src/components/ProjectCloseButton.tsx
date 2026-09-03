"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { closeProjectAction } from "@/app/projects/actions";

/** The only UI action that ever closes a Project — never automatic, never
 * tied to a goal deadline (see projects.close in src/lib/projects.ts). */
export function ProjectCloseButton({
  projectId,
  onClosed,
}: {
  projectId: string;
  /** Called after a successful close, in addition to router.refresh() — the
   * inline pane inside ZettelkastenScreen isn't on the /projects/[id] route,
   * so it needs its own way to know the close finished and update its state. */
  onClosed?: () => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    await closeProjectAction(projectId);
    setPending(false);
    setOpen(false);
    router.refresh();
    onClosed?.();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-line-strong px-3 py-1.5 font-mono text-[10.5px] text-ink-soft transition-colors hover:border-accent hover:text-accent"
      >
        {t.projects.closeButton}
      </button>
      <ConfirmDialog
        open={open}
        title={t.projects.closeConfirmTitle}
        warning={t.projects.closeConfirmWarning}
        confirmLabel={t.projects.closeButton}
        confirmPending={pending}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      >
        <p className="font-mono text-[10px] text-ink-faint">{t.projects.closeOnlyManualNote}</p>
      </ConfirmDialog>
    </div>
  );
}
