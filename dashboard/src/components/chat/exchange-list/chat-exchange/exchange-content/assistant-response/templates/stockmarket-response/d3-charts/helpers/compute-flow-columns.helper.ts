import type { HeatmapCell } from './build-heatmap-cells.helper';

/** One day of flow-ribbon geometry (price space). */
export interface FlowColumn {
  /** Volume-weighted center price of the day. */
  centroid: number;
  /** Half the ribbon height in price units (volume-weighted spread). */
  halfWidth: number;
  /** 0..1: the day's volume share of the busiest day. */
  intensity: number;
}

interface DayStats {
  total: number;
  centroid: number;
  spread: number;
}

/** Raw per-day aggregates from a day's band cells. */
function aggregateDay(cells: HeatmapCell[]): DayStats | null {
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

  return carried.map((_, i) => {
    const window = carried
      .slice(Math.max(0, i - smoothingWindow + 1), i + 1)
      .map((s) => s ?? firstStat)
      .filter((s): s is DayStats => s !== null);
    const centroid =
      window.reduce((sum, s) => sum + s.centroid, 0) / (window.length || 1);
    const halfWidth = Math.max(
      window.reduce((sum, s) => sum + s.spread, 0) / (window.length || 1),
      minHalfWidth,
    );
    return {
      centroid,
      halfWidth,
      intensity: (stats[i]?.total ?? 0) / maxTotal,
    };
  });
}
