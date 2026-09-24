import type { HeatmapCell } from './build-heatmap-cells.helper';

interface BandGrid {
  minPrice: number;
  step: number;
  bandCount: number;
}

/** Build one heatmap day's non-empty cells from its volume row. */
export function mapRowToHeatmapCells(
  row: { time: string; volumes: number[] },
  grid: BandGrid,
  maxVolume: number,
) {
  return {
    time: row.time,
    cells: row.volumes
      .map((volume, i): HeatmapCell | null =>
        volume > 0
          ? {
              low: grid.minPrice + i * grid.step,
              high: grid.minPrice + (i + 1) * grid.step,
              amount: Math.min(100, (volume / maxVolume) * 100),
            }
          : null,
      )
      .filter((cell): cell is HeatmapCell => cell !== null),
  };
}
