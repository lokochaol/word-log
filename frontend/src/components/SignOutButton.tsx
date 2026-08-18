"use client";

import { googleSignOut } from "@/app/actions";
import { useI18n } from "@/lib/i18n/LocaleProvider";

export function SignOutButton() {
  const { t } = useI18n();
  return (
    <form action={googleSignOut}>
      <button
        type="submit"
        className="text-xs font-medium tracking-wide text-ink-soft transition-colors hover:text-ink"
      >
        {t.common.signOut}
      </button>
    </form>
  );
}
