/** The signed-in email shown inside HeaderMenu — styled as a plain info
 * badge (background chip, no hover) rather than the link style used by the
 * page items around it, since it isn't a page and isn't tappable. */
export function HeaderAccountBadge({ email }: { email: string }) {
  return (
    <span className="rounded-md bg-surface-alt px-2 py-1 font-mono text-[9.5px] text-ink-faint">{email}</span>
  );
}
