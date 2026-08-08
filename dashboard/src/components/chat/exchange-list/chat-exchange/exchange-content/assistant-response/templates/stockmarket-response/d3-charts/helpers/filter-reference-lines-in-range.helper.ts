import type { D3ReferenceLine } from '../D3Chart.types';

/** The series slice the data's price range is derived from. */
export interface PriceRangePoint {
  high: number;
  low: number;
}

/**
 * Keep only reference lines whose price level exists in the charted series.
 *
 * The model occasionally emits a level it picked up elsewhere (e.g. a
 * web-searched all-time high) that does not match the charted
 * (split-adjusted) history. Such a line would float above or below every
 * rendered bar, line, and cell, so out-of-range levels are dropped entirely
 * rather than clamped. A small margin forgives rounding noise around the
 * extreme prices.
 */
export function filterReferenceLinesInRange(
  lines: D3ReferenceLine[],
  points: PriceRangePoint[],
  marginRatio = 0.03,
): D3ReferenceLine[] {
  if (points.length === 0) return lines;
  let minLow = Infinity;
  let maxHigh = -Infinity;
  for (const point of points) {
    if (point.low < minLow) minLow = point.low;
    if (point.high > maxHigh) maxHigh = point.high;
  }
  const margin = (maxHigh - minLow) * marginRatio;
  return lines.filter(
    (line) => line.value >= minLow - margin && line.value <= maxHigh + margin,
  );
}
