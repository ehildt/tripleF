function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Normalize one key-finding entry into the `{ text }` shape. */
export function mapKeyFinding(item: unknown): { text: string } {
  if (typeof item === 'string') return { text: item };
  if (isRecord(item) && typeof item.text === 'string') {
    return { text: item.text };
  }
  return { text: String(item) };
}
