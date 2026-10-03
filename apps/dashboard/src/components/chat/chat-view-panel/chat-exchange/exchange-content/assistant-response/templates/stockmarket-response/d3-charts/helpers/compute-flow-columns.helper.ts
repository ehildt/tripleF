import { aggregateDay } from './aggregate-day.helper';
import type { HeatmapCell } from './build-heatmap-cells.helper.types';
import type { DayStats, FlowColumn } from './compute-flow-columns.helper.types';
import { mapCarriedToColumn } from './map-carried-to-column.helper';

/**
 * Compute the flow-ribbon geometry per day from band cells: a volume-weighted
 * price centroid, a volume-weighted spread as half-width, and the day
 * intensity. Zero-volume days carry the previous day's position so the
 * ribbon never breaks. A trailing moving average smooths the channel so it
 * reads as a flow instead of a jittery band. Ported from the lightweight-
 * charts heatmap plugin.
 */
export function computeFlowColumns(
  daysCells: HeatmapCell[][],
  smoothingWindow = 3,
  minHalfWidth = 0.01,
): FlowColumn[] {
  const stats = daysCells.map(aggregateDay);
  const maxTotal = Math.max(...stats.map((s) => s?.total ?? 0), 1);

  // Fill gaps by carrying the previous day's shape forward.
  const carried: Array<DayStats | null> = [];
  let previous: DayStats | null = null;
  for (const stat of stats) {
    if (stat ?? previous) {
      const filled = (stat ?? previous) as DayStats;
      previous = filled;
      carried.push(filled);
    } else {
      carried.push(null);
    }
  }

  // Leading zero-volume days fall back to the first real day — the ribbon
  // starts flat rather than collapsing onto the zero line.
  const firstStat = stats.find((s): s is DayStats => s !== null) ?? null;

  return carried.map((_, i) =>
    mapCarriedToColumn(
      _,
      i,
      carried,
      firstStat,
      smoothingWindow,
      minHalfWidth,
      stats,
      maxTotal,
    ),
  );
}
