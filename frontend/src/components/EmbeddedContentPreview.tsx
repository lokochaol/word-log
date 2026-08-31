import { parseEmbeddedContent } from "@/lib/embeddedContent";
import { MermaidPreview } from "@/components/MermaidPreview";

/** Renders a note's content string as text/code/mermaid/image segments —
 * the read-only counterpart to MarkdownNoteEditor's source mode. Used both
 * by that editor (its own "not currently focused" preview) and by places
 * that only ever display a note's content, never edit it (the Zettelkasten
 * permanent-note detail modal, PileDrill's flat-pile cards). */
export function EmbeddedContentPreview({ content, emptyLabel }: { content: string; emptyLabel?: string }) {
  const segments = parseEmbeddedContent(content);

  if (segments.length === 0) {
    return emptyLabel ? <p className="text-sm text-ink-faint">{emptyLabel}</p> : null;
  }

  return (
    <div className="flex flex-col gap-3">
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return (
            <p key={i} className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {seg.content}
            </p>
          );
        }
        if (seg.type === "code") {
          return (
            <div key={i} className="rounded-md bg-surface-alt p-3">
              {seg.language && <p className="mb-1.5 font-mono text-[10px] text-ink-soft">{seg.language}</p>}
              <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-ink">{seg.content}</pre>
            </div>
          );
        }
        if (seg.type === "mermaid") {
          return <MermaidPreview key={i} source={seg.content} />;
        }
        return (
          <div key={i} className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={seg.url} alt={seg.caption} className="h-32 w-fit max-w-full rounded-md object-cover" />
            {seg.caption && <p className="text-xs text-ink-soft">{seg.caption}</p>}
          </div>
        );
      })}
    </div>
  );
}
