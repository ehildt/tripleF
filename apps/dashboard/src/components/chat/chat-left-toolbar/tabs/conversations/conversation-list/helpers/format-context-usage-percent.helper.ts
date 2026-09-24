/**
 * Format a context-usage percentage as a human-readable string.
 * Returns null when no value is available yet, so the caller can hide the
 * indicator entirely instead of showing a placeholder like "--".
 */
export function formatContextUsagePercent(
  contextUsagePercent: string | null | undefined,
): string | null {
  return contextUsagePercent != null && contextUsagePercent !== ''
    ? `${contextUsagePercent}%`
    : null;
}
