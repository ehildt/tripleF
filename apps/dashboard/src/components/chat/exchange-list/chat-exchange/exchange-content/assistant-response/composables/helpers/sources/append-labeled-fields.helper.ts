/**
 * Push "Label: value" lines for each non-empty, trimmed value. Shared by the
 * template-to-plain-text transforms (article, product) for their header
 * fields (category, title, subtitle).
 */
export function appendLabeledFields(
  parts: string[],
  fields: Array<[string, string | undefined]>,
): void {
  for (const [label, value] of fields) {
    const trimmed = value?.trim();
    if (trimmed) parts.push(`${label}: ${trimmed}`);
  }
}
