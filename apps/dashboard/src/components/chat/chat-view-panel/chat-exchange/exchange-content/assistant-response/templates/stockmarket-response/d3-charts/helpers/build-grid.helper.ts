import type {
  BandGrid,
  HeatmapHistoryPoint,
} from './build-heatmap-cells.helper.types';

/** The global price-band grid spanning the full history window. */
export function buildGrid(
  history: HeatmapHistoryPoint[],
  bandCount: number,
): BandGrid {
  const minPrice = Math.min(...history.map((p) => p.low));
  const maxPrice = Math.max(...history.map((p) => p.high));
  return { minPrice, step: (maxPrice - minPrice || 1) / bandCount, bandCount };
}
