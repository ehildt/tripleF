/**
 * Strip all HTML tags from a string, returning plain text.
 */
export function stripHtml(html: string): string {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el.textContent ?? '';
}
