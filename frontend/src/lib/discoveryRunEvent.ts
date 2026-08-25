export type DiscoveryRunEventDetail =
  | { phase: "running" }
  | { phase: "done"; notesChecked: number; candidatesFound: number }
  | { phase: "error" };

const EVENT_NAME = "discovery-run";

/** DiscoveryTriggerButton lives inside HeaderMenu's dropdown, which unmounts
 * the instant it's clicked (the dropdown closes on any click inside it,
 * including its own trigger) — so the button's own pending/result state is
 * gone before the search has even started, and previously the only visible
 * feedback was a window.alert() that could pop up a long, silent while
 * later. Dispatching a plain window CustomEvent lets DiscoveryRunToast (a
 * separate component mounted outside the menu, so it survives the collapse)
 * show that same feedback without the two having to share React state
 * across that unmount boundary. */
export function dispatchDiscoveryRunEvent(detail: DiscoveryRunEventDetail) {
  window.dispatchEvent(new CustomEvent<DiscoveryRunEventDetail>(EVENT_NAME, { detail }));
}

export function onDiscoveryRunEvent(handler: (detail: DiscoveryRunEventDetail) => void): () => void {
  function listener(e: Event) {
    handler((e as CustomEvent<DiscoveryRunEventDetail>).detail);
  }
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
