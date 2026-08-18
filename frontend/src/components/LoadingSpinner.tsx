"use client";

import { useI18n } from "@/lib/i18n/LocaleProvider";

const SIZE_CLASS = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-7 w-7",
  lg: "h-11 w-11",
} as const;

export type SpinnerSize = keyof typeof SIZE_CLASS;

/** HUD-styled spinner — a spinning accent arc over a static ring, with a
 * pulsing core, reusing the app's existing radar/pulse visual language. Used
 * for both full-page (`PageLoading`) and inline/partial (`LoadingBlock`)
 * loading states so every "loading" moment in the app reads the same way. */
export function Spinner({ size = "md", className = "" }: { size?: SpinnerSize; className?: string }) {
  const { t } = useI18n();
  return (
    <span
      role="status"
      aria-label={t.loadingSpinner.statusAriaLabel}
      className={`relative inline-flex shrink-0 items-center justify-center ${SIZE_CLASS[size]} ${className}`}
    >
      <span className="absolute inset-0 rounded-full border-2 border-line-strong" />
      <span className="absolute inset-0 animate-spin-fast rounded-full border-2 border-transparent border-t-accent border-r-accent" />
      <span className="absolute inset-[32%] animate-pulse-dot rounded-full bg-accent" />
    </span>
  );
}

/** Inline loading indicator for a specific region/section — drop this in
 * wherever content is being fetched to replace a bare loading label. */
export function LoadingBlock({
  label,
  size = "sm",
  className = "",
}: {
  label?: string;
  size?: SpinnerSize;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <div className={`flex items-center justify-center gap-2.5 py-8 font-mono text-[10.5px] tracking-wider text-ink-soft ${className}`}>
      <Spinner size={size} />
      <span>{label ?? t.common.loading}</span>
    </div>
  );
}

/** Full-viewport loading state for route-level `loading.tsx` files. Route
 * `loading.tsx` files are Server Components, so `label` is always passed
 * explicitly there (via getDictionary(await getLocale())) rather than relying
 * on this component's own (client-only) locale context. */
export function PageLoading({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg">
      <Spinner size="lg" />
      <p className="font-mono text-[10.5px] tracking-[0.25em] text-ink-soft uppercase">{label ?? t.common.loading}</p>
    </div>
  );
}
