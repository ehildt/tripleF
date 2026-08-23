import type { D3ReferenceLine } from '../D3Chart.types';

/**
 * Drop reference lines whose value is within `epsilon` (relative) of an
 * already-kept line. Guards against the model emitting near-duplicate levels
 * (e.g. current price and previous close) that would render as overlapping
 * dashed lines with adjacent value badges. Ported from the lightweight-charts
 * helper.
 */
export function dedupeReferenceLines(
  lines: D3ReferenceLine[],
  epsilon = 0.005,
): D3ReferenceLine[] {
  const kept: D3ReferenceLine[] = [];
  for (const line of lines) {
    const isDuplicate = kept.some(
      (k) =>
        Math.abs(k.value - line.value) / Math.max(Math.abs(line.value), 1) <
        epsilon,
    );
    if (!isDuplicate) kept.push(line);
  }
  return kept;
}
