/** A buy/sell marker anchored to a bar. */
export interface PivotMarker {
  time: string;
  position: 'aboveBar' | 'belowBar';
  color: string;
  shape: 'arrowUp' | 'arrowDown';
  text: string;
}

/** The history slice pivot detection runs over. */
export interface PivotHistoryPoint {
  time: string;
  high: number;
  low: number;
}

/** The hues for buy and sell markers (green buy, red sell, by convention). */
export interface PivotMarkerColors {
  buy: string;
  sell: string;
}
