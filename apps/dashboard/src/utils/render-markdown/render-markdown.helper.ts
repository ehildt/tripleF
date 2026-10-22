import MarkdownIt from 'markdown-it';

import { sanitizeHtml } from '../sanitize-html/sanitize-html.helper';

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

/** Max memoized renderMarkdown results (FIFO eviction beyond the cap). */
const CACHE_CAP = 500;

/** Source content → sanitized HTML. Referentially transparent memoization. */
const htmlCache = new Map<string, string>();

/**
 * Shift model-authored heading levels down by two (h1 → h3, …, clamped at
 * h6). Chat prose lives inside responses whose own outline is h2 (response
 * title) and h3 (sub-section titles); raw `#` headings would otherwise
 * render as page-level h1s inside a chat bubble.
 */
markdown.core.ruler.push(
  'shift-heading-levels',
  // markdown-it keeps its StateCore type off the package root export; the
  // rule only needs the token stream, so a structural view of it suffices.
  (state: { tokens: { type: string; tag: string }[] }) => {
    for (const token of state.tokens) {
      if (token.type !== 'heading_open' && token.type !== 'heading_close')
        continue;
      const level = Number.parseInt(token.tag.slice(1), 10);
      if (Number.isNaN(level)) continue;
      token.tag = `h${Math.min(level + 2, 6)}`;
    }
  },
);

/**
 * Render a markdown string to sanitized HTML, safe for v-html. Raw HTML in
 * the source is escaped by markdown-it; DOMPurify sanitizes the output.
 *
 * Memoized by source content: the chat re-renders every message of the
 * active conversation on each remount (conversation switches, route
 * changes), and markdown-it + DOMPurify are the per-mount burst — a repeat
 * render is a Map lookup. FIFO-evicted at CACHE_CAP so a long session can
 * not grow the cache forever.
 */
export function renderMarkdown(content: string): string {
  if (!content) return '';
  const cached = htmlCache.get(content);
  if (cached !== undefined) return cached;
  const html = sanitizeHtml(markdown.render(content));
  if (htmlCache.size >= CACHE_CAP) {
    const oldest = htmlCache.keys().next().value;
    if (oldest !== undefined) htmlCache.delete(oldest);
  }
  htmlCache.set(content, html);
  return html;
}
