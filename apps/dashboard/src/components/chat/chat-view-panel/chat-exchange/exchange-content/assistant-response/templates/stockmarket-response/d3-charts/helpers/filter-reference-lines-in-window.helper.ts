import type { D3ReferenceLine } from '../D3Chart.types';

/** A series slice with prices so the visible range can be derived. */
export interface WindowPricePoint {
  high: number;
  low: number;
  close: number;
}

/**
 * Keep only reference lines whose price level actually occurs in the visible
 * window: the bar whose price is closest to the level sits inside
 * `[from, to)`. Extreme annotations anchored outside the selected range
 * (e.g. a 52W high line over a 3M window) are dropped, so every annotation
 * respects the range the user selected.
 */
export function filterReferenceLinesInWindow(
  lines: D3ReferenceLine[],
  points: WindowPricePoint[],
  from: number,
  to: number,
): D3ReferenceLine[] {
  if (points.length === 0) return lines;
  const start = Math.max(0, from);
  const end = Math.min(points.length, to);
  return lines.filter((line) => {
    let bestIndex = -1;
    let bestDiff = Infinity;
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const diff = Math.min(
        Math.abs(point.high - line.value),
        Math.abs(point.low - line.value),
        Math.abs(point.close - line.value),
      );
      const inWindow = i >= start && i < end;
      // Prefer an in-window bar on ties (e.g. the same price repeated).
      if (diff < bestDiff || (inWindow && diff === bestDiff)) {
        bestDiff = diff;
        bestIndex = i;
      }
    }
    return bestIndex >= start && bestIndex < end;
  });
}
