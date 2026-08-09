import { NewWordForm } from "@/components/NewWordForm";

export default async function NewWordPage(props: PageProps<"/words/new">) {
  const params = await props.searchParams;
  const initialText = typeof params.text === "string" ? params.text : "";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 py-16">
      <div className="w-full max-w-[520px] rounded-xl border border-line bg-surface p-8 shadow-sm">
        <h1 className="mb-2 text-xl font-extrabold tracking-tight text-ink">新しい出会いを記録</h1>
        <p className="mb-6 text-xs leading-relaxed text-ink-soft">
          いま出会った単語だけを記録します。意味は登録後の詳細画面から追加できます。
        </p>
        <NewWordForm initialText={initialText} />
      </div>
    </main>
  );
}
