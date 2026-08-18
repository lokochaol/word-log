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

export function GuideContentEn() {
  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col gap-4">
        <p className="font-mono text-[10.5px] tracking-[0.25em] text-accent uppercase">Guide</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink text-balance">What is a Zettelkasten?</h1>
        <p className="max-w-[62ch] text-sm leading-relaxed text-ink-soft">
          Everyone takes notes. A <em className="text-ink not-italic font-semibold">Zettelkasten</em> (German for
          &ldquo;slip-box&rdquo;) is a specific method for making notes <strong className="text-ink">grow</strong>{" "}
          into something more — practiced by sociologist Niklas Luhmann and popularized by Sönke Ahrens&rsquo; book
          {" "}
          <em className="not-italic text-ink">How to Take Smart Notes</em>. It doesn&rsquo;t need talent or a good
          memory. Almost every rule in it is really just about one thing: linking notes to each other.
        </p>
      </section>

      <section className="flex flex-col gap-5">
        <Eyebrow>1. A note only matters once it&rsquo;s linked</Eyebrow>
        <p className="max-w-[62ch] text-sm leading-relaxed text-ink-soft">
          A single note, on its own, isn&rsquo;t worth much. Something you found interesting enough to write down
          will lose its context within a few weeks and go back to being a stray fragment. The core idea of a
          Zettelkasten is that value doesn&rsquo;t live in the note itself — it lives in the{" "}
          <strong className="text-ink">link between notes</strong>. A note only becomes knowledge once it&rsquo;s
          connected to something else.
        </p>
        <DiagramFrame>
          <LinkedNotesDiagram leftLabel="Notes alone" rightLabel="Notes, linked" />
        </DiagramFrame>
      </section>

      <section className="flex flex-col gap-5">
        <Eyebrow>2. Two stages — fleeting and permanent</Eyebrow>
        <p className="max-w-[62ch] text-sm leading-relaxed text-ink-soft">
          Trying to write something carefully the moment you think of it rarely works out. So a Zettelkasten
          separates capturing a fragment of thought quickly (a fleeting note) from later choosing the ones worth
          keeping, rewriting them in your own words, linking them to what already exists, and only then adding them
          to the box as a permanent note. Fleeting notes are disposable — only the ones worth rewriting survive
          into the Zettelkasten.
        </p>
        <DiagramFrame>
          <TwoStageFlowDiagram fleetingLabel="Fleeting notes" arrowLabel="Select & rewrite" permanentLabel="Permanent note, linked" />
        </DiagramFrame>
      </section>

      <section className="flex flex-col gap-5">
        <Eyebrow>3. No folders — just a small index</Eyebrow>
        <p className="max-w-[62ch] text-sm leading-relaxed text-ink-soft">
          You never have to decide &ldquo;which folder does this belong in.&rdquo; A Zettelkasten has no category
          hierarchy — notes sit in one ordered sequence and connect to each other through links, like a web. You
          only need a handful of &ldquo;index&rdquo; keywords, for the entry points you&rsquo;ll genuinely come back
          to often. Structure emerges later, from the links themselves, not from a category you chose upfront.
        </p>
        <DiagramFrame>
          <NoFoldersDiagram folderLabel="Folders (skip this)" indexLabel="A few index entries" />
        </DiagramFrame>
      </section>

      <section className="flex flex-col gap-5">
        <Eyebrow>4. An order you can always insert into</Eyebrow>
        <p className="max-w-[62ch] text-sm leading-relaxed text-ink-soft">
          Luhmann gave his physical cards addresses like <code className="rounded bg-surface-alt px-1.5 py-0.5 text-[11px] text-ink">21/3d7a26</code>{" "}
          so a new card could always be slotted between two existing ones — no renumbering, ever. That one trick is
          what lets a Zettelkasten stay chronologically ordered while still branching wherever a thought needs to
          branch.
        </p>
        <DiagramFrame>
          <InsertionDiagram label="A new note can always land between A and B" />
        </DiagramFrame>
      </section>

      <section className="flex flex-col gap-4 border-t border-line pt-12">
        <p className="font-mono text-[10.5px] tracking-[0.25em] text-accent uppercase">How this app works</p>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">Using it in this app</h2>
        <p className="max-w-[62ch] text-sm leading-relaxed text-ink-soft">
          &ldquo;Dash Off&rdquo; and &ldquo;Zettelkasten&rdquo; in this app map directly onto the two stages above.
        </p>
      </section>

      <section className="flex flex-col gap-5">
        <DiagramFrame>
          <AppMapDiagram
            dashOffLabel="① Dash Off"
            promoteLabel="Select & promote"
            zettelkastenLabel="② Zettelkasten"
            literatureLabel="Literature memo (either side)"
          />
        </DiagramFrame>
        <ol className="flex flex-col gap-4">
          {[
            {
              title: "① Write anything into Dash Off",
              body: "Capture whatever crosses your mind — something you just read, a thought from a conversation with an AI, anything — without worrying about form. It's a disposable space by design; nothing here is precious yet.",
            },
            {
              title: "② Promote only what's worth keeping",
              body: "Select a few Dash Off notes you actually want to develop, give the result a title, and rewrite it in your own words. Every promoted note needs at least one link to another permanent note or index entry, so nothing ends up isolated.",
            },
            {
              title: "③ Choose where it sits",
              body: "Permanent notes share one global order. Drill into the Zettelkasten screen's piles and tap the gap-slot between two existing notes to insert yours there — the same idea as Luhmann's addressing scheme.",
            },
            {
              title: "④ Keep the index small",
              body: "Only register keywords you'll genuinely reference often. The index is meant to be an entry point, not a filing system — from there you follow links.",
            },
            {
              title: "Literature memos work from either side",
              body: "A summary of something you read, in your own words, is stored once as a literature memo and can be linked from Dash Off notes or permanent notes alike — the same source never needs to be summarized twice.",
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
          Further reading: Sönke Ahrens, <em className="not-italic">How to Take Smart Notes</em>.
        </p>
      </section>
    </div>
  );
}
