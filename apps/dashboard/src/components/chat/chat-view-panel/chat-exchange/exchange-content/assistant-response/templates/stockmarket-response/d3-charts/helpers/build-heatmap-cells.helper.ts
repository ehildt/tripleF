import { mapDayToHeatmapRow } from './map-day-to-heatmap-row.helper';
import { mapRowToHeatmapCells } from './map-row-to-heatmap-cells.helper';

/** One price-band cell of a heatmap day. */
export interface HeatmapCell {
  low: number;
  high: number;
  amount: number;
}

/** One day's non-empty band cells on the global price grid. */
export interface HeatmapDayCells {
  time: string;
  cells: HeatmapCell[];
}

/** The history slice the heatmap grid is built from. */
export interface HeatmapHistoryPoint {
  time: string;
  high: number;
  low: number;
  volume: number;
}

/** Per-day, per-price-band volume from the EODHD intraday tool. */
export interface HeatmapProfilePoint {
  time: string;
  bands: Array<{ low: number; high: number; volume: number }>;
}

interface BandGrid {
  minPrice: number;
  step: number;
  bandCount: number;
}

function buildGrid(
  history: HeatmapHistoryPoint[],
  bandCount: number,
): BandGrid {
  const minPrice = Math.min(...history.map((p) => p.low));
  const maxPrice = Math.max(...history.map((p) => p.high));
  return { minPrice, step: (maxPrice - minPrice || 1) / bandCount, bandCount };
}

/** Bands of the grid a daily [low, high] range overlaps. */
function touchedBandIndices(
  day: HeatmapHistoryPoint,
  grid: BandGrid,
): number[] {
  const indices: number[] = [];
  for (let i = 0; i < grid.bandCount; i++) {
    const low = grid.minPrice + i * grid.step;
    if (low < day.high && low + grid.step > day.low) indices.push(i);
  }
  return indices;
}

/** Share a day's volume evenly across the bands its price range touched. */
function dailyVolumes(day: HeatmapHistoryPoint, grid: BandGrid): number[] {
  const volumes = new Array<number>(grid.bandCount).fill(0);
  const touched = touchedBandIndices(day, grid);
  const share = touched.length > 0 ? day.volume / touched.length : 0;
  for (const i of touched) volumes[i] = share;
  return volumes;
}

/** Rebin intraday band volumes onto the global grid by overlap share. */
function rebinnedProfileVolumes(
  bands: HeatmapProfilePoint['bands'],
  grid: BandGrid,
): number[] {
  const volumes = new Array<number>(grid.bandCount).fill(0);
  for (const band of bands) {
    const width = band.high - band.low;
    if (width <= 0) continue;
    for (let i = 0; i < grid.bandCount; i++) {
      const low = grid.minPrice + i * grid.step;
      const overlap =
        Math.min(band.high, low + grid.step) - Math.max(band.low, low);
      if (overlap > 0) volumes[i] += band.volume * (overlap / width);
    }
  }
  return volumes;
}

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
