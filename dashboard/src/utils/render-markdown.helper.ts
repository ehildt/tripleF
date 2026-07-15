import MarkdownIt from 'markdown-it';

import { sanitizeHtml } from './sanitize-html.helper';

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

/**
 * Render a markdown string to sanitized HTML, safe for v-html. Raw HTML in
 * the source is escaped by markdown-it; DOMPurify sanitizes the output.
 */
export function renderMarkdown(content: string): string {
  if (!content) return '';
  return sanitizeHtml(markdown.render(content));
}
