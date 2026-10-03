import type { BandGrid, HeatmapCell } from './build-heatmap-cells.helper.types';

/** One heatmap day: its timestamp plus the per-band volumes for that day. */
interface VolumeRow {
  time: string;
  volumes: number[];
}

/** Build one heatmap day's non-empty cells from its volume row. */
export function mapRowToHeatmapCells(
  row: VolumeRow,
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
