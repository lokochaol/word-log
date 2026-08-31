/**
 * Parses a note's plain-text/Markdown content into displayable segments —
 * the "preview" half of MarkdownNoteEditor.tsx. Deliberately narrow: only
 * ```lang fences (code), ```mermaid fences (diagrams), and a whole line of
 * ![caption](url) (images) are recognized as anything other than plain
 * text. No headings, lists, bold/italic, or other markdown syntax — this
 * mirrors exactly the four embed kinds the old TEXT/CODE/MERMAID/IMAGE
 * block model supported, just written inline instead of as separate rows.
 */

export type ContentSegment =
  | { type: "text"; content: string }
  | { type: "code"; language: string; content: string }
  | { type: "mermaid"; content: string }
  | { type: "image"; url: string; caption: string };

const FENCE_OPEN_RE = /^```(\S*)\s*$/;
const FENCE_CLOSE_RE = /^```\s*$/;
const IMAGE_LINE_RE = /^!\[([^\]]*)\]\(([^)]+)\)$/;

export function parseEmbeddedContent(source: string): ContentSegment[] {
  const lines = source.split("\n");
  const segments: ContentSegment[] = [];
  let textBuf: string[] = [];
  let i = 0;

  function flushText() {
    const content = textBuf.join("\n");
    if (content.trim().length > 0) segments.push({ type: "text", content });
    textBuf = [];
  }

  while (i < lines.length) {
    const line = lines[i];
    const fenceMatch = line.match(FENCE_OPEN_RE);
    if (fenceMatch) {
      flushText();
      const lang = fenceMatch[1];
      const body: string[] = [];
      i++;
      while (i < lines.length && !FENCE_CLOSE_RE.test(lines[i])) {
        body.push(lines[i]);
        i++;
      }
      i++; // skip the closing fence line, if present
      if (lang.toLowerCase() === "mermaid") {
        segments.push({ type: "mermaid", content: body.join("\n") });
      } else {
        segments.push({ type: "code", language: lang, content: body.join("\n") });
      }
      continue;
    }

    const imageMatch = line.trim().match(IMAGE_LINE_RE);
    if (imageMatch) {
      flushText();
      segments.push({ type: "image", caption: imageMatch[1], url: imageMatch[2] });
      i++;
      continue;
    }

    textBuf.push(line);
    i++;
  }
  flushText();
  return segments;
}
