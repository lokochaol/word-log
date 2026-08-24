"use client";

import { useState, useTransition } from "react";
import { Spinner } from "@/components/LoadingSpinner";
import { saveDiscoveryScheduleAction } from "@/app/settings/actions";
import type { DiscoverySchedule } from "@/lib/discovery";
import { useI18n } from "@/lib/i18n/LocaleProvider";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function HourSelect({ label, value, onChange }: { label: string; value: number; onChange: (h: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[9.5px] tracking-wider text-ink-faint uppercase">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border border-line bg-surface-alt px-3 py-2 font-mono text-xs text-ink focus:border-accent focus:outline-none"
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {String(h).padStart(2, "0")}:00
          </option>
        ))}
      </select>
    </div>
  );
}

export function DiscoveryScheduleForm({ initial }: { initial: DiscoverySchedule }) {
  const { t } = useI18n();
  const [timesPerDay, setTimesPerDay] = useState<1 | 2>(initial.timesPerDay);
  const [hour1, setHour1] = useState(initial.hour1);
  const [hour2, setHour2] = useState(initial.hour2);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await saveDiscoveryScheduleAction({ timesPerDay, hour1, hour2 });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[9.5px] tracking-wider text-ink-faint uppercase">
          {t.settings.discoveryTimesPerDayLabel}
        </label>
        <div className="flex gap-2">
          {([1, 2] as const).map((n) => (
            <button
              key={n}
              onClick={() => setTimesPerDay(n)}
              className={`rounded-full border px-3 py-1 font-mono text-[10.5px] transition-colors ${
                timesPerDay === n
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line text-ink-soft hover:border-line-strong"
              }`}
            >
              {n === 1 ? t.settings.discoveryTimesOnce : t.settings.discoveryTimesTwice}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <HourSelect label={t.settings.discoveryHour1Label} value={hour1} onChange={setHour1} />
        {timesPerDay === 2 && <HourSelect label={t.settings.discoveryHour2Label} value={hour2} onChange={setHour2} />}
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={pending}
          className="btn-sheen flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-on-accent transition-transform hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
        >
          {pending && <Spinner size="xs" />}
          {pending ? t.common.saving : saved ? t.common.saved : t.common.save}
        </button>
      </div>
    </div>
  );
}
