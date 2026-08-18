"use client";

import type { ReactNode } from "react";
import { Spinner } from "@/components/LoadingSpinner";

/** Generic modal confirmation, e.g. "索引に追加しますか？" (§9's one genuinely new interaction primitive). */
export function ConfirmDialog({
  open,
  title,
  warning,
  children,
  confirmLabel = "追加",
  cancelLabel = "キャンセル",
  onConfirm,
  onCancel,
  confirmDisabled = false,
  confirmPending = false,
}: {
  open: boolean;
  title: string;
  warning?: ReactNode;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmDisabled?: boolean;
  /** Shows a spinner on the confirm button (e.g. while a delete is in flight). */
  confirmPending?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
      <div className="w-[300px] rounded-xl border border-accent/40 bg-surface p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]">
        <p className="text-sm font-bold text-ink">{title}</p>
        {warning && (
          <p className="mt-2 mb-4 rounded-r-md border-l-2 border-accent bg-accent-soft px-2.5 py-2 text-xs leading-relaxed text-ink-soft">
            {warning}
          </p>
        )}
        {children && <div className="mb-4">{children}</div>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-surface-alt"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="btn-sheen flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-on-accent transition-transform hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
          >
            {confirmPending && <Spinner size="xs" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
