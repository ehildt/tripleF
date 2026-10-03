/**
 * Strip all HTML tags from a string, returning plain text. Uses a detached
 * DOM node so entities are decoded and unclosed/nested tags are handled the
 * way a browser would, rather than relying on a fragile regex.
 *
 * Memoized by input: callers re-strip the same rendered HTML across
 * re-renders (collapsed exchanges, dropdown labels, list toggles), and the
 * DOM parse is the per-render burst — a repeat strip is a Map lookup.
 * FIFO-evicted so a long session cannot grow the cache forever.
 */

/** Max memoized stripHtml results (FIFO eviction beyond the cap). */
const CACHE_CAP = 500;

/** Rendered HTML → plain text. Referentially transparent memoization. */
const textCache = new Map<string, string>();

export function stripHtml(html: string): string {
  if (!html) return '';
  const cached = textCache.get(html);
  if (cached !== undefined) return cached;

  const el = document.createElement('div');
  el.innerHTML = html;
  const text = el.textContent ?? '';

  if (textCache.size >= CACHE_CAP) {
    const oldest = textCache.keys().next().value;
    if (oldest !== undefined) textCache.delete(oldest);
  }
  textCache.set(html, text);
  return text;
}
