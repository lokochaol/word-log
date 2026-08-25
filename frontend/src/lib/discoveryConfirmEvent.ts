const EVENT_NAME = "discovery-confirm-request";

/** DiscoveryTriggerButton lives inside HeaderMenu's dropdown, which
 * unmounts the instant it's clicked, so — same reasoning as
 * discoveryRunEvent.ts — it can't own a confirm-dialog's open state itself.
 * It just asks (via a window event) for DiscoveryConfirmDialog, mounted
 * outside the menu, to open. */
export function dispatchDiscoveryConfirmRequest() {
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function onDiscoveryConfirmRequest(handler: () => void): () => void {
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
