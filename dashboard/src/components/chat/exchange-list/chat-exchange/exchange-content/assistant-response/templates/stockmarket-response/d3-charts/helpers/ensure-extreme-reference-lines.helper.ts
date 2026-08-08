import type { D3ReferenceLine } from '../D3Chart.types';
import {
  computeRangeExtremes,
  type DatedPricePoint,
} from './compute-range-extremes.helper';
import { normalizeExtremeLineLabel } from './normalize-extreme-line-label.helper';

/**
 * Guarantee exactly one level line per extreme of the visible range: the
 * range high ("{label} HIGH", purple) and low ("{label} LOW", teal), with
 * the badge on the right. A model-emitted line at an extreme is replaced by
 * the canonical label and color so the badge always reads e.g. "1Y HIGH" /
 * "1Y LOW". The generated lines list first so a later same-value merge
 * keeps their canonical color. Skipped for intraday series, where the
 * concept makes no sense.
 */
export function ensureExtremeReferenceLines(
  lines: D3ReferenceLine[],
  points: DatedPricePoint[],
  range: { from: number; to: number },
  label: string,
  enabled = true,
): D3ReferenceLine[] {
  const extremes = enabled
    ? computeRangeExtremes(points, range.from, range.to)
    : null;
  if (!extremes) return lines;
  const { high, low } = extremes;
  const tolerance = (high.price - low.price) * 0.001 || 1e-9;
  const kept = lines
    .filter(
      (line) =>
        Math.abs(line.value - high.price) > tolerance &&
        Math.abs(line.value - low.price) > tolerance,
    )
    // Model labels like "52w high" follow the canonical "52W HIGH" format.
    .map((line) => ({ ...line, label: normalizeExtremeLineLabel(line.label) }));
  const generated: D3ReferenceLine[] = [
    { value: high.price, label: `${label} HIGH`, color: 'harmony-2' },
  ];
  if (low.price !== high.price) {
    generated.push({
      value: low.price,
      label: `${label} LOW`,
      color: 'harmony-4',
    });
  }
  // Generated extremes first: mergeDuplicateReferenceLines keeps the first
  // line of a same-value group, so the canonical purple/teal color wins
  // over a re-emitting model line.
  return [...generated, ...kept];
}
