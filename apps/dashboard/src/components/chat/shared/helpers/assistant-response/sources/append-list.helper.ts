/**
 * Push a titled bullet list of { text } entries: the heading followed by one
 * "- text" line per non-empty entry. Shared by the template-to-plain-text
 * transforms and the generic store flattener for key findings, strengths,
 * weaknesses, and similar sections.
 */
export function appendList(
  parts: string[],
  title: string,
  items?: Array<{ text?: string }>,
): void {
  if (!items?.length) return;
  parts.push(title);
  for (const item of items) {
    const text = item.text?.trim();
    if (text) parts.push(`- ${text}`);
  }
}
