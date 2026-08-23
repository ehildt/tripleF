/**
 * Resolve the playback anchor's scroll container for a figure element: the
 * closest ancestor explicitly marked as a playback scroll root (the chat's
 * ScrollableExchangeList). Deliberately NOT a computed-style walk — any
 * intermediate element with overflow-y:auto (video list item text columns,
 * code blocks) would masquerade as the scroller and pin the intersection
 * ratio to 1 forever. Returns null when the figure lives outside a marked
 * container; the viewport is the effective scroller then.
 */
export function findAnchorScrollRoot(el: HTMLElement): HTMLElement | null {
  return el.closest<HTMLElement>('[data-playback-scroll-root]');
}
