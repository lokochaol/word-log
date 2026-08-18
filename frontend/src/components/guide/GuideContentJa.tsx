import { HudFrame } from "@/components/HudFrame";
import {
  LinkedNotesDiagram,
  TwoStageFlowDiagram,
  InsertionDiagram,
  NoFoldersDiagram,
  AppMapDiagram,
} from "@/components/guide/GuideDiagrams";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10.5px] font-semibold tracking-[0.2em] text-ink-soft uppercase">
      <span className="text-accent">{"//"}</span> {children}
    </p>
  );
}

function DiagramFrame({ children }: { children: React.ReactNode }) {
  return (
    <HudFrame active={false} innerClassName="flex items-center justify-center rounded-xl px-6 py-8">
      {children}
    </HudFrame>
  );
}

export function GuideContentJa() {
  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col gap-4">
        <p className="font-mono text-[10.5px] tracking-[0.25em] text-accent uppercase">Guide</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink text-balance">
          ツェッテルカステンってなに？
        </h1>
        <p className="max-w-[62ch] text-sm leading-relaxed text-ink-soft">
          「メモを取る」だけなら誰でもやっている。ツェッテルカステン（Zettelkasten、ドイツ語で「メモ箱」）は、社会学者ニクラス・ルーマンが実践し、ゾンケ・アーレンス『TAKE
          NOTES!』で紹介された、メモを<strong className="text-ink">育てる</strong>ための方法です。
          特別な才能や記憶力は要りません。ルールはとてもシンプルで、ほとんどが「メモとメモをつなぐ」ことに関するものです。
        </p>
      </section>

      <section className="flex flex-col gap-5">
        <Eyebrow>1. メモは、つながって初めて意味を持つ</Eyebrow>
        <p className="max-w-[62ch] text-sm leading-relaxed text-ink-soft">
          1枚のメモが単体で持つ価値は、実はそれほど大きくありません。「これは面白い」と思って書き留めたメモも、そのまま放置すれば数週間後には文脈を失い、ただの断片に戻ってしまいます。
          ツェッテルカステンの核心は、メモそのものではなく<strong className="text-ink">メモとメモの間のリンク</strong>に価値を置くことです。1枚のメモは、他のメモと結びついたときに初めて「知識」になります。
        </p>
        <DiagramFrame>
          <LinkedNotesDiagram leftLabel="バラバラのメモ" rightLabel="つながったメモ" />
        </DiagramFrame>
      </section>

      <section className="flex flex-col gap-5">
        <Eyebrow>2. 2段階で書く — 走り書きと永久保存版</Eyebrow>
        <p className="max-w-[62ch] text-sm leading-relaxed text-ink-soft">
          思いついたことをその場で丁寧に書こうとすると、たいてい続きません。だからツェッテルカステンでは、まず思考の断片を気軽に書き留める段階（走り書き／fleeting
          notes）と、後からそれを選び、自分の言葉で書き直し、既存のメモとリンクさせて初めて「永久保存版」として箱に加える段階を分けます。
          走り書きは使い捨てで構いません — 価値があるものだけが、書き直されてツェッテルカステンに残ります。
        </p>
        <DiagramFrame>
          <TwoStageFlowDiagram fleetingLabel="走り書き（一時的）" arrowLabel="選んで書き直す" permanentLabel="永久保存版（リンク済み）" />
        </DiagramFrame>
      </section>

      <section className="flex flex-col gap-5">
        <Eyebrow>3. フォルダ分けをしない — 索引だけを頼りに辿る</Eyebrow>
        <p className="max-w-[62ch] text-sm leading-relaxed text-ink-soft">
          「これは何のフォルダに入れるべきか」を毎回悩む必要はありません。ツェッテルカステンにカテゴリの階層はなく、メモは基本的に時系列に並び、リンクによって網の目のようにつながります。
          頻繁に辿り着きたい場所だけ、少数の「索引」キーワードとして目印を立てておけば十分です。分類は後から、リンクの積み重ねとして自然に浮かび上がってきます。
        </p>
        <DiagramFrame>
          <NoFoldersDiagram folderLabel="フォルダ分け（しない）" indexLabel="少数の索引" />
        </DiagramFrame>
      </section>

      <section className="flex flex-col gap-5">
        <Eyebrow>4. どこにでも挿し込める順番</Eyebrow>
        <p className="max-w-[62ch] text-sm leading-relaxed text-ink-soft">
          ルーマンは実物のカードに <code className="rounded bg-surface-alt px-1.5 py-0.5 text-[11px] text-ink">21/3d7a26</code>{" "}
          のような住所を振り、既存の2枚の間に新しいカードをいくらでも挿し込めるようにしました。番号を振り直す必要はありません。
          この「後から間に挿せる」という一点だけで、ツェッテルカステンは時系列も保ちながら、思考の枝分かれにも対応できる柔軟な構造になります。
        </p>
        <DiagramFrame>
          <InsertionDiagram label="AとBの間に、いつでも新しいメモを挿し込める" />
        </DiagramFrame>
      </section>

      <section className="flex flex-col gap-4 border-t border-line pt-12">
        <p className="font-mono text-[10.5px] tracking-[0.25em] text-accent uppercase">How this app works</p>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">このアプリでの使い方</h2>
        <p className="max-w-[62ch] text-sm leading-relaxed text-ink-soft">
          このアプリの「走り書き（Dash Off）」と「ツェッテルカステン」は、そのまま上の2段階に対応しています。
        </p>
      </section>

      <section className="flex flex-col gap-5">
        <DiagramFrame>
          <AppMapDiagram
            dashOffLabel="① 走り書き"
            promoteLabel="選んで昇格"
            zettelkastenLabel="② ツェッテルカステン"
            literatureLabel="文献メモ（両方から参照）"
          />
        </DiagramFrame>
        <ol className="flex flex-col gap-4">
          {[
            {
              title: "① 走り書き（Dash Off）にとにかく書く",
              body: "思いついたこと、読んだものの断片、AIとの会話の中で気づいたことなどを、体裁を気にせずどんどん記録します。あとで消えても困らない、使い捨て前提の場所です。",
            },
            {
              title: "② 育てたいものだけ選んで、永久保存版メモに昇格",
              body: "走り書きの中から「これは残したい」というものを複数選び、タイトルを付けて自分の言葉で書き直します。他の永久保存版メモや索引エントリへのリンクを最低1つ付けるので、単独のメモとして孤立することはありません。",
            },
            {
              title: "③ 保存位置を選ぶ",
              body: "永久保存版メモは全体で1本の順序を持ちます。ツェッテルカステン画面の「山」をドリルダウンして、既存の2件の間の帯状スロットをタップすれば、その場所に挿し込まれます — ルーマンの住所方式と同じ考え方です。",
            },
            {
              title: "④ 索引はごく少数だけ",
              body: "本当によく参照するキーワードだけを索引に登録します。索引はあくまで入り口で、そこから先はリンクを辿って探索するのがツェッテルカステンの流儀です。",
            },
            {
              title: "文献メモは両方から参照できる",
              body: "本や論文を読んで得た「自分の言葉での要約」は、文献メモとして独立して保存され、走り書き・永久保存版メモのどちらからでもリンクできます。同じ文献に何度も出会っても、要約は1つに集約されます。",
            },
          ].map((step, i) => (
            <li key={i} className="flex gap-4 rounded-lg border border-line bg-surface-alt p-4">
              <span className="shrink-0 font-mono text-xs font-bold text-accent">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-ink">{step.title}</p>
                <p className="text-xs leading-relaxed text-ink-soft">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-2 border-t border-line pt-8">
        <p className="font-mono text-[10.5px] text-ink-faint">
          参考: ゾンケ・アーレンス『TAKE NOTES! — メモで、あなただけのアウトプットが自然にできるようになる。』
        </p>
      </section>
    </div>
  );
}
