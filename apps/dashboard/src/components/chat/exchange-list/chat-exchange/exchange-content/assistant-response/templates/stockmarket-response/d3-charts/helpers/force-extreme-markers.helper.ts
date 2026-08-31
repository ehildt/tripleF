import type { MarkerLayout } from './build-marker-layout.helper';
import {
  computeRangeExtremes,
  type DatedPricePoint,
} from './compute-range-extremes.helper';
import { decorateExtremeMarker } from './decorate-extreme-marker.helper';

/**
 * Render markers anchored at the visible range's high/low bars as bullets
 * (circles) in a distinguished tone — "{label} HIGH" above the high bar,
 * "{label} LOW" below the low one (e.g. "1Y HIGH", "All LOW") — regardless
 * of the shape/color the source (a pivot arrow or a model annotation) chose:
 * the bullet and its level line are one annotation. Missing bullets are
 * appended; the first marker on an extreme bar wins, and duplicates on the
 * same bar are dropped.
 */
export function forceExtremeMarkers(
  layouts: MarkerLayout[],
  points: DatedPricePoint[],
  range: { from: number; to: number },
  label: string,
  colors: { high: string; low: string },
  formatPrice: (price: number) => string,
): MarkerLayout[] {
  const extremes = computeRangeExtremes(points, range.from, range.to);
  if (!extremes) return layouts;
  const { high, low } = extremes;

  const result = [...layouts];
  if (!result.some((layout) => layout.index === high.index)) {
    result.push({
      index: high.index,
      price: high.price,
      symbol: 'circle',
      color: undefined,
      text: null,
      textAbove: true,
      pinToWindow: true,
    });
  }
  if (
    low.index !== high.index &&
    !result.some((layout) => layout.index === low.index)
  ) {
    result.push({
      index: low.index,
      price: low.price,
      symbol: 'circle',
      color: undefined,
      text: null,
      textAbove: false,
      pinToWindow: true,
    });
  }
  if (result.length === 0) return result;

  const decorated = result.map((layout) =>
    decorateExtremeMarker(layout, extremes, label, colors, formatPrice),
  );

  // A forced bullet wins over any duplicate marker on the same extreme bar.
  const seen = new Set<number>();
  return decorated.filter((layout) => {
    const isExtreme = layout.index === high.index || layout.index === low.index;
    if (!isExtreme) return true;
    if (seen.has(layout.index)) return false;
    seen.add(layout.index);
    return true;
  });
}
