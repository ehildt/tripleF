import type { AxisDomains } from './build-axis-domain.helper';

/** A marker that must stay in view while panning/zooming. */
type MarkerDomainPoint = {
  /** Bar index of the marker. */
  index: number;
  /** Price of the marker label/anchor. */
  price: number;
};

/**
 * Expand a price domain to include any visible marker price (with a small
 * margin so the marker label never clips), so markers never float above or
 * below the plot — during pans and after zooms alike. Domains are returned
 * unchanged when no visible marker falls outside them.
 */
export function expandDomainsForMarkers(
  domains: AxisDomains,
  markers: MarkerDomainPoint[],
  visibleFrom: number,
  visibleTo: number,
): AxisDomains {
  const span = domains.price[1] - domains.price[0];
  const margin = span * 0.05;
  let result = domains;
  for (const marker of markers) {
    if (marker.index < visibleFrom || marker.index >= visibleTo) continue;
    if (marker.price < result.price[0]) {
      result = {
        ...result,
        price: [marker.price - margin, result.price[1]],
      };
    } else if (marker.price > result.price[1]) {
      result = {
        ...result,
        price: [result.price[0], marker.price + margin],
      };
    }
  }
  return result;
}
