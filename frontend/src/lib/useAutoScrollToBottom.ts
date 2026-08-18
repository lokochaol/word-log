"use client";

import { useEffect, useRef } from "react";

/**
 * For a chat-style list where the newest item is last in the DOM: jumps the
 * scroll container to the bottom on mount and whenever `dep` changes (e.g.
 * the list's length), so the latest entry is what's visible by default and
 * scrolling up is the only way to reach older ones.
 */
export function useAutoScrollToBottom<T extends HTMLElement>(dep: unknown) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [dep]);

  return ref;
}
