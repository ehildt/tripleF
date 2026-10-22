/** The embedded text of a synopsis point (and its stored `text` payload). */
export function synopsisText(title: string, summary: string): string {
  return `${title}\n${summary}`.trim();
}
