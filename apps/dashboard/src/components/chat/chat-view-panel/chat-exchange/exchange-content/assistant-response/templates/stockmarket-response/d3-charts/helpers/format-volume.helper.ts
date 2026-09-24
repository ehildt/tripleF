/**
 * Format a raw share/contract count into a compact, human-readable string.
 * Values at or above one million render as `M`, thousands as `K`. Ported from
 * the lightweight-charts helper.
 */
export function formatVolume(volume: number): string {
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(2)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`;
  return String(volume);
}
