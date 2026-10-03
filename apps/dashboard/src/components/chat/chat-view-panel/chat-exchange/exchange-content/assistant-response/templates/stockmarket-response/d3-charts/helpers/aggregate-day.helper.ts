import type { HeatmapCell } from './build-heatmap-cells.helper.types';
import type { DayStats } from './compute-flow-columns.helper.types';

/** Raw per-day aggregates from a day's band cells. */
export function aggregateDay(cells: HeatmapCell[]): DayStats | null {
  const total = cells.reduce((sum, c) => sum + c.amount, 0);
  if (total <= 0) return null;
  const centroid =
    cells.reduce((sum, c) => sum + c.amount * ((c.low + c.high) / 2), 0) /
    total;
  const spread = Math.sqrt(
    cells.reduce(
      (sum, c) => sum + c.amount * ((c.low + c.high) / 2 - centroid) ** 2,
      0,
    ) / total,
  );
  return { total, centroid, spread };
}
