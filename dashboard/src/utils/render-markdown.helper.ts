import MarkdownIt from 'markdown-it';

import { sanitizeHtml } from './sanitize-html.helper';

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

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
 */
export function renderMarkdown(content: string): string {
  if (!content) return '';
  return sanitizeHtml(markdown.render(content));
}
