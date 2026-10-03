import type {
  PivotHistoryPoint,
  PivotMarker,
  PivotMarkerColors,
} from './build-pivot-markers.helper.types';
import { isPivotHigh } from './is-pivot-high.helper';
import { isPivotLow } from './is-pivot-low.helper';
import { MAX_MARKERS, PIVOT_WINDOW } from './pivot-marker.constant';

/**
 * Buy/sell markers from price pivots: a bar that is the local high marks a
 * sell, a local low marks a buy. Buy markers are green and sell markers are
 * red, per the stock-market convention. Ported from the lightweight-charts
 * marker builder so both charts show the same signals.
 */
export function buildPivotMarkers(
  history: PivotHistoryPoint[],
  colors: PivotMarkerColors,
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
