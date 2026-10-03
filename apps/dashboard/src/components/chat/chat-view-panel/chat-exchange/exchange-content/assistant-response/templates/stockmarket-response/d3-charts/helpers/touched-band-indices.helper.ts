import type {
  BandGrid,
  HeatmapHistoryPoint,
} from './build-heatmap-cells.helper.types';

/** Bands of the grid a daily [low, high] range overlaps. */
export function touchedBandIndices(
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
