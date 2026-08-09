export function HomeSearchBar() {
  return (
    <form action="/search" method="GET" className="group">
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-5 py-4 text-sm text-ink-soft shadow-sm transition-all duration-200 focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--color-accent-soft)]">
        <span aria-hidden="true">🔍</span>
        <input
          type="text"
          name="q"
          placeholder="単語・意味・関連語で検索…"
          className="w-full bg-transparent text-ink placeholder:text-ink-soft focus:outline-none"
        />
      </div>
    </form>
  );
}
