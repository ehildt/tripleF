import type { MarkerLayout } from './build-marker-layout.helper';
import type { RangeExtremes } from './compute-range-extremes.helper';

/** Decorate one marker when it sits on the range's high or low bar. */
export function decorateExtremeMarker(
  layout: MarkerLayout,
  extremes: RangeExtremes,
  label: string,
  colors: { high: string; low: string },
  formatPrice: (price: number) => string,
): MarkerLayout {
  const { high, low } = extremes;
  if (layout.index === high.index) {
    return {
      ...layout,
      symbol: 'circle' as const,
      color: colors.high,
      price: high.price,
      text: `${label} HIGH @ ${formatPrice(high.price)}`,
      textAbove: true,
    };
  }
  if (layout.index === low.index) {
    return {
      ...layout,
      symbol: 'circle' as const,
      color: colors.low,
      price: low.price,
      text: `${label} LOW @ ${formatPrice(low.price)}`,
      textAbove: false,
    };
  }
  return layout;
}
