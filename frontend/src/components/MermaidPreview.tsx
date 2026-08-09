"use client";

import { useEffect, useId, useState } from "react";

export function MermaidPreview({ source }: { source: string }) {
  const id = useId().replace(/:/g, "-");
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!source.trim()) return;
    import("mermaid").then(async ({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: "neutral", fontFamily: "var(--font-inter)" });
      try {
        const { svg: rendered } = await mermaid.render(`mermaid-${id}`, source);
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setSvg(null);
          setError("Mermaid構文を確認してください");
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [source, id]);

  if (!source.trim()) return null;
  if (error) return <p className="text-xs text-accent">{error}</p>;
  if (!svg) return null;

  return <div className="flex justify-center overflow-x-auto py-2" dangerouslySetInnerHTML={{ __html: svg }} />;
}
