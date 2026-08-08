/** A series slice with dates so the visible range can be derived. */
export interface DatedPricePoint {
  time: string;
  high: number;
  low: number;
}

/** The high/low extremes over a slice of a series. */
export interface RangeExtremes {
  high: { index: number; price: number };
  low: { index: number; price: number };
}

/**
 * The highest high and lowest low over `points[from..to)` — the visible
 * range the user selected. Both the level lines and the marker bullets are
 * derived from this, so they always agree. Returns null for an empty or
 * degenerate slice.
 */
export function computeRangeExtremes(
  points: DatedPricePoint[],
  from: number,
  to: number,
): RangeExtremes | null {
  if (points.length === 0) return null;
  const start = Math.max(0, from);
  const end = Math.min(points.length, to);
  if (end <= start) return null;
  let highIndex = start;
  let lowIndex = start;
  for (let i = start; i < end; i++) {
    if (points[i].high > points[highIndex].high) highIndex = i;
    if (points[i].low < points[lowIndex].low) lowIndex = i;
  }
  return {
    high: { index: highIndex, price: points[highIndex].high },
    low: { index: lowIndex, price: points[lowIndex].low },
  };
}
