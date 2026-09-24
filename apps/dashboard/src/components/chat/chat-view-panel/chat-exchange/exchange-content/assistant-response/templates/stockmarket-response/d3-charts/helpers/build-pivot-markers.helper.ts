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

/** Points on each side a bar must exceed to count as a pivot high/low. */
const PIVOT_WINDOW = 3;
/** Maximum number of markers to render (most recent kept). */
const MAX_MARKERS = 20;

/** Whether the bar at `i` is higher than every bar in its pivot window. */
function isPivotHigh(history: PivotHistoryPoint[], i: number): boolean {
  for (let j = i - PIVOT_WINDOW; j <= i + PIVOT_WINDOW; j++) {
    if (j === i) continue;
    if (history[j].high >= history[i].high) return false;
  }
  return true;
}

/** Whether the bar at `i` is lower than every bar in its pivot window. */
function isPivotLow(history: PivotHistoryPoint[], i: number): boolean {
  for (let j = i - PIVOT_WINDOW; j <= i + PIVOT_WINDOW; j++) {
    if (j === i) continue;
    if (history[j].low <= history[i].low) return false;
  }
  return true;
}

/**
 * Buy/sell markers from price pivots: a bar that is the local high marks a
 * sell, a local low marks a buy. Buy markers are green and sell markers are
 * red, per the stock-market convention. Ported from the lightweight-charts
 * marker builder so both charts show the same signals.
 */
export function buildPivotMarkers(
  history: PivotHistoryPoint[],
  colors: { buy: string; sell: string },
): PivotMarker[] {
  const markers: PivotMarker[] = [];
  for (let i = PIVOT_WINDOW; i < history.length - PIVOT_WINDOW; i++) {
    const point = history[i];
    if (isPivotHigh(history, i)) {
      markers.push({
        time: point.time,
        position: 'aboveBar',
        color: colors.sell,
        shape: 'arrowDown',
        text: `${point.high.toFixed(2)} Sell`,
      });
    } else if (isPivotLow(history, i)) {
      markers.push({
        time: point.time,
        position: 'belowBar',
        color: colors.buy,
        shape: 'arrowUp',
        text: `${point.low.toFixed(2)} Buy`,
      });
    }
  }
  const seen = new Set<string>();
  const deduped: PivotMarker[] = [];
  for (const marker of markers) {
    if (seen.has(marker.time)) continue;
    seen.add(marker.time);
    deduped.push(marker);
  }
  return deduped.slice(-MAX_MARKERS);
}
