/** Parse arbitrary persisted tab keys, retaining only boolean overrides. */
export function parseTabVisibility(
  raw: string | null,
): Record<string, boolean> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {};
    }
    const visibility: Record<string, boolean> = {};
    for (const [tab, visible] of Object.entries(parsed)) {
      if (typeof visible === 'boolean') visibility[tab] = visible;
    }
    return visibility;
  } catch {
    return {};
  }
}
