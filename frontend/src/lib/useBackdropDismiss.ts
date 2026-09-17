"use client";

import { useRef, type MouseEvent } from "react";

/**
 * Props for an overlay's backdrop that make "click outside to close" mean a
 * click that both *started* and ended on the backdrop.
 *
 * A plain `onClick` on the backdrop can't tell those apart: selecting text
 * inside the card and releasing the mouse past its edge fires a click whose
 * target is the common ancestor of the press and the release — the backdrop
 * — so dragging to select the last word of a line would close the overlay
 * and throw the selection away. Since the press landed on the card, and the
 * card stops the click from propagating, remembering where the press landed
 * is enough to tell a real outside click from a selection that overshot.
 *
 * Spread the result onto the backdrop element; the card inside still needs
 * its own `onClick={(e) => e.stopPropagation()}`.
 */
export function useBackdropDismiss(onDismiss: () => void) {
  const pressedOnBackdrop = useRef(false);

  return {
    onMouseDown: (e: MouseEvent<HTMLElement>) => {
      pressedOnBackdrop.current = e.target === e.currentTarget;
    },
    onClick: (e: MouseEvent<HTMLElement>) => {
      if (e.target !== e.currentTarget || !pressedOnBackdrop.current) return;
      pressedOnBackdrop.current = false;
      onDismiss();
    },
  };
}
