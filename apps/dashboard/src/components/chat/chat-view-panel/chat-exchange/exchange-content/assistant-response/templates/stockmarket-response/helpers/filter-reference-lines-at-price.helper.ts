import type { ChartReferenceLine } from '@/types/harness-response-data.model';

/** Relative epsilon for considering a line "at" the current price. */
const PRICE_EPSILON = 0.001;

/**
 * Drop reference lines within `epsilon` (relative) of the current price. The
 * price axis and legend already show the current price, so a line there just
 * duplicates the visible price. The model is told not to emit one, but this is
 * a safety net for when it does. The epsilon is kept tight (0.1%) so genuine
 * nearby levels — e.g. a round-number resistance just above the price — are
 * not mistaken for a duplicate.
 */
export function filterReferenceLinesAtPrice(
  lines: ChartReferenceLine[],
  currentPrice: number | undefined,
  epsilon = PRICE_EPSILON,
): ChartReferenceLine[] {
  if (currentPrice === undefined) return lines;
  return lines.filter(
    (l) =>
      Math.abs(l.value - currentPrice) / Math.max(Math.abs(currentPrice), 1) >=
      epsilon,
  );
}
