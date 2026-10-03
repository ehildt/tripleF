import type { PivotHistoryPoint } from './build-pivot-markers.helper.types';
import { PIVOT_WINDOW } from './pivot-marker.constant';

/** Whether the bar at `i` is lower than every bar in its pivot window. */
export function isPivotLow(history: PivotHistoryPoint[], i: number): boolean {
  for (let j = i - PIVOT_WINDOW; j <= i + PIVOT_WINDOW; j++) {
    if (j === i) continue;
    if (history[j].low <= history[i].low) return false;
  }
  return true;
}
