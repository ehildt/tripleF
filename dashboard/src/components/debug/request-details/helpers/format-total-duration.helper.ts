/**
 * Format a nanosecond duration into a human-friendly string.
 */
export function formatTotalDuration(ns: number): string {
  const ms = ns / 1_000_000;
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}
