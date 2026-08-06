/**
 * Strip all HTML tags from a string, returning plain text. Uses a detached
 * DOM node so entities are decoded and unclosed/nested tags are handled the
 * way a browser would, rather than relying on a fragile regex.
 */
export function stripHtml(html: string): string {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el.textContent ?? '';
}
