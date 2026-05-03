export function stripHtml(html: string): string {
  // eslint-disable-next-line sonarjs/slow-regex
  return html.replace(/<[^>]*>/g, '');
}
