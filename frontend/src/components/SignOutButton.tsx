import { googleSignOut } from "@/app/actions";

export function SignOutButton() {
  return (
    <form action={googleSignOut}>
      <button
        type="submit"
        className="text-xs font-medium tracking-wide text-ink-soft transition-colors hover:text-ink"
      >
        ログアウト
      </button>
    </form>
  );
}
