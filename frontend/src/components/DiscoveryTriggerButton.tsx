"use client";

import { useState } from "react";
import { runDiscoveryAction } from "@/app/scratch/actions";
import { dispatchDiscoveryRunEvent } from "@/lib/discoveryRunEvent";
import { useI18n } from "@/lib/i18n/LocaleProvider";

const RELOAD_DELAY_MS = 1200;

/** Manual "今すぐ探す" trigger for the twice-daily (7:00/19:00) discovery
 * batch — see src/app/api/cron/discovery for the scheduled version of the
 * same call. Lives inside HeaderMenu's dropdown, which unmounts itself the
 * instant this is clicked, so feedback goes through DiscoveryRunToast (a
 * window event, see discoveryRunEvent.ts) rather than this component's own
 * state — nothing here would still be mounted to show it. Results can land
 * on any note's shelf, not just ones currently rendered client-side, so a
 * successful run still reloads the page rather than trying to splice
 * results into ScratchTimeline's local state; the delay just gives the
 * toast a moment to be read first. */
export function DiscoveryTriggerButton() {
  const { t } = useI18n();
  const [pending, setPending] = useState(false);

  function run() {
    setPending(true);
    dispatchDiscoveryRunEvent({ phase: "running" });
    runDiscoveryAction()
      .then(({ notesChecked, candidatesFound }) => {
        dispatchDiscoveryRunEvent({ phase: "done", notesChecked, candidatesFound });
        setTimeout(() => window.location.reload(), RELOAD_DELAY_MS);
      })
      .catch(() => {
        dispatchDiscoveryRunEvent({ phase: "error" });
        setPending(false);
      });
  }

  return (
    <button
      onClick={run}
      disabled={pending}
      className="font-mono text-[10px] text-ink-soft transition-colors hover:text-accent disabled:opacity-50"
    >
      {pending ? t.discovery.triggerRunning : t.discovery.triggerLabel}
    </button>
  );
}
