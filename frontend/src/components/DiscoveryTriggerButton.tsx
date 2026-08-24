"use client";

import { useState } from "react";
import { runDiscoveryAction } from "@/app/scratch/actions";
import { useI18n } from "@/lib/i18n/LocaleProvider";

/** Manual "今すぐ探す" trigger for the twice-daily (7:00/19:00) discovery
 * batch — see src/app/api/cron/discovery for the scheduled version of the
 * same call. Results can land on any note's shelf, not just ones currently
 * rendered client-side, so this reloads the page once it's done rather than
 * trying to splice results into ScratchTimeline's local state. */
export function DiscoveryTriggerButton() {
  const { t } = useI18n();
  const [pending, setPending] = useState(false);

  function run() {
    setPending(true);
    runDiscoveryAction().then(({ notesChecked, candidatesFound }) => {
      window.alert(t.discovery.triggerResult(notesChecked, candidatesFound));
      window.location.reload();
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
