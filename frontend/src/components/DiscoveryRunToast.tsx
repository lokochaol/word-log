"use client";

import { useEffect, useRef, useState } from "react";
import { onDiscoveryRunEvent, type DiscoveryRunEventDetail } from "@/lib/discoveryRunEvent";
import { useI18n } from "@/lib/i18n/LocaleProvider";

const VISIBLE_MS = 3200;
const EXIT_MS = 300;

/** DiscoveryTriggerButton sits inside HeaderMenu's dropdown, which unmounts
 * the instant it's clicked (any click inside closes it), so this listens
 * for a window event instead of taking a prop — a fixed-position overlay,
 * independent of that menu's lifecycle, is the only way the "running" /
 * "done" / "error" feedback can survive the button vanishing out from under
 * it. Slides down from above the content on mount, then slides back up and
 * fades out on its own — no click-to-dismiss, this is a passing status
 * update, not something waiting on the reader. */
export function DiscoveryRunToast() {
  const { t } = useI18n();
  const [status, setStatus] = useState<DiscoveryRunEventDetail | null>(null);
  const [leaving, setLeaving] = useState(false);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return onDiscoveryRunEvent((detail) => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
      if (unmountTimerRef.current) clearTimeout(unmountTimerRef.current);
      setStatus(detail);
      setLeaving(false);
      if (detail.phase !== "running") {
        leaveTimerRef.current = setTimeout(() => setLeaving(true), VISIBLE_MS);
        unmountTimerRef.current = setTimeout(() => setStatus(null), VISIBLE_MS + EXIT_MS);
      }
    });
  }, []);

  if (!status) return null;

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center transition-all duration-300 ease-out ${
        leaving ? "-translate-y-6 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="flex items-center gap-2.5 rounded-full border border-accent/60 bg-surface px-4 py-2 font-mono text-[10.5px] tracking-wide text-ink shadow-[0_10px_40px_-10px_var(--color-accent)] backdrop-blur-sm">
        {status.phase === "running" && (
          <>
            <span aria-hidden="true" className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-accent">{t.discovery.triggerRunning}</span>
          </>
        )}
        {status.phase === "done" && (
          <>
            <span aria-hidden="true" className="text-accent">
              ✓
            </span>
            {t.discovery.triggerResult(status.notesChecked, status.candidatesFound)}
          </>
        )}
        {status.phase === "error" && (
          <>
            <span aria-hidden="true" className="text-accent">
              ⚠
            </span>
            {t.discovery.triggerFailed}
          </>
        )}
      </div>
    </div>
  );
}
