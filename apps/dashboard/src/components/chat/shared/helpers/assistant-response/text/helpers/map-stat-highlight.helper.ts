/** Normalize one stat highlight into trimmed label/value. */
export function mapStatHighlight(item: Record<string, unknown>) {
  return {
    label: (item.label as string).trim(),
    value: (item.value as string).trim(),
  };
}
