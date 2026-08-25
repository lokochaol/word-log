"use client";

import { dispatchDiscoveryConfirmRequest } from "@/lib/discoveryConfirmEvent";
import { useI18n } from "@/lib/i18n/LocaleProvider";

/** Manual "今すぐ探す" trigger for the twice-daily (7:00/19:00) discovery
 * batch — see src/app/api/cron/discovery for the scheduled version of the
 * same call. Lives inside HeaderMenu's dropdown, which unmounts itself the
 * instant this is clicked, so this only ever dispatches a window event
 * asking DiscoveryConfirmDialog (mounted at page level, outside the menu)
 * to open — the actual confirm/run/feedback flow lives there instead of in
 * this button, which wouldn't survive long enough to own any of it. */
export function DiscoveryTriggerButton() {
  const { t } = useI18n();

  return (
    <button
      onClick={dispatchDiscoveryConfirmRequest}
      className="font-mono text-[10px] text-ink-soft transition-colors hover:text-accent"
    >
      {t.discovery.triggerLabel}
    </button>
  );
}
