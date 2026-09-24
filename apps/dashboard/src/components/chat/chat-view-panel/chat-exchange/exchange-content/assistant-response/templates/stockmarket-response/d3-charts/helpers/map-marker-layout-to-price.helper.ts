import type { MarkerLayout } from './build-marker-layout.helper';

/** Project a marker layout to its index/price pair. */
export function mapMarkerLayoutToPrice(layout: MarkerLayout) {
  return { index: layout.index, price: layout.price };
}
