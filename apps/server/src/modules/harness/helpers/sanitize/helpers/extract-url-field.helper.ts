/** Read the first non-empty URL field from a result item. */
export function extractUrlField(
  item: Record<string, unknown>,
  primaryKey: string,
): string | undefined {
  const candidates = [item[primaryKey], item.url, item.link];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim())
      return candidate.trim();
  }
  return undefined;
}
