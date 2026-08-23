export type MarkerSymbol = 'arrowUp' | 'arrowDown' | 'circle' | 'square';

/** One marker placed in data space, ready for the scale mapping. */
export interface MarkerLayout {
  /** Bar index the marker anchors to. */
  index: number;
  /** Anchor price: the bar high for aboveBar, the bar low for belowBar. */
  price: number;
  symbol: MarkerSymbol;
  /** Already-resolved color (rgba string). */
  color: string | undefined;
  /** Label rendered beside the marker. */
  text: string | null;
  /** Whether the label sits above (aboveBar) or below (belowBar). */
  textAbove: boolean;
  /**
   * The marker belongs to the selected range's extremes and is pinned to the
   * visible window when zoomed in, so it never disappears.
   */
  pinToWindow?: boolean;
}

/** A marker input with its color already resolved by the caller. */
export interface MarkerInput {
  time: string;
  position: 'aboveBar' | 'belowBar';
  color?: string;
  shape: 'circle' | 'arrowUp' | 'arrowDown' | 'square';
  text?: string;
}

/** The history slice markers anchor to. */
export interface MarkerHistoryPoint {
  time: string;
  high: number;
  low: number;
}

/**
 * Resolve marker inputs into per-bar layouts: the bar index (by time), the
 * anchor price (high for aboveBar, low for belowBar), the symbol, the label
 * side, and the passed-through color. Markers whose time is missing from the
 * history are dropped.
 */
export function buildMarkerLayouts(
  markers: MarkerInput[],
  points: MarkerHistoryPoint[],
): MarkerLayout[] {
  const indexByTime = new Map(points.map((point, i) => [point.time, i]));
  const layouts: MarkerLayout[] = [];
  for (const marker of markers) {
    const index = indexByTime.get(marker.time);
    if (index === undefined) continue;
    const point = points[index];
    const above = marker.position === 'aboveBar';
    layouts.push({
      index,
      price: above ? point.high : point.low,
      symbol: marker.shape,
      color: marker.color,
      text: marker.text ?? null,
      textAbove: above,
    });
  }
  return layouts;
}
