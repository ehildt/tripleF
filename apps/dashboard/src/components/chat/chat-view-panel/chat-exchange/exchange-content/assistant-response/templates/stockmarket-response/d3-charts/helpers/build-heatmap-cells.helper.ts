import { buildGrid } from './build-grid.helper';
import type {
  HeatmapDayCells,
  HeatmapHistoryPoint,
  HeatmapProfilePoint,
} from './build-heatmap-cells.helper.types';
import { dailyVolumes } from './daily-volumes.helper';
import { mapDayToHeatmapRow } from './map-day-to-heatmap-row.helper';
import { mapRowToHeatmapCells } from './map-row-to-heatmap-cells.helper';
import { rebinnedProfileVolumes } from './rebinned-profile-volumes.helper';

/**
 * Build one heatmap column per history day, on a global price-band grid
 * spanning the full history window. Days with an intraday volume profile get
 * their band volumes rebinned onto the grid by overlap share; days without
 * spread the day's volume evenly across the bands its [low, high] touched.
 * Amounts are 0..100 relative to the max cell volume. Ported from the
 * lightweight-charts heatmap plugin's data builder.
 */
export function buildHeatmapCells(
  history: HeatmapHistoryPoint[],
  volumeProfile: HeatmapProfilePoint[] | undefined,
  bandCount = 10,
): HeatmapDayCells[] {
  if (history.length === 0 || bandCount < 1) return [];

  const profileByDay = new Map(
    (volumeProfile ?? []).map((day) => [day.time, day] as const),
  );
  const grid = buildGrid(history, bandCount);

  const rows = history.map((day) =>
    mapDayToHeatmapRow(
      day,
      profileByDay,
      grid,
      rebinnedProfileVolumes,
      dailyVolumes,
    ),
  );

  const maxVolume = Math.max(...rows.flatMap((r) => r.volumes), 1);
  return rows.map((row) => mapRowToHeatmapCells(row, grid, maxVolume));
}
