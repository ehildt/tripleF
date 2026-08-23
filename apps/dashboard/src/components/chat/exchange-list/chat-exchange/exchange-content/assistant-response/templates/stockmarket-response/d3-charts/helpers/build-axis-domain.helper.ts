/** The per-bar values the y domains are derived from. */
export interface AxisDomainPoint {
  low: number;
  high: number;
  volume: number;
}

export interface AxisDomains {
  /** Price domain including the marker-label headroom. */
  price: [number, number];
  /** Volume domain, present only when the scales are split. */
  volume: [number, number] | null;
}

/**
 * Compute the y domains from the visible bars: the price domain spans the
 * bars' [low, high] with symmetric headroom (reserved for marker labels),
 * and the volume domain spans 0..max volume when the volume style splits the
 * plot into its own band.
 */
export function buildAxisDomains(
  points: AxisDomainPoint[],
  priceHeadroom: number,
  splitVolume: boolean,
): AxisDomains {
  if (points.length === 0) {
    return { price: [0, 1], volume: splitVolume ? [0, 1] : null };
  }
  let minLow = Infinity;
  let maxHigh = -Infinity;
  let maxVolume = 0;
  for (const point of points) {
    if (point.low < minLow) minLow = point.low;
    if (point.high > maxHigh) maxHigh = point.high;
    if (point.volume > maxVolume) maxVolume = point.volume;
  }
  if (minLow === maxHigh) maxHigh = minLow + 1;
  return {
    price: [minLow - priceHeadroom, maxHigh + priceHeadroom],
    volume: splitVolume ? [0, Math.max(maxVolume, 1)] : null,
  };
}
