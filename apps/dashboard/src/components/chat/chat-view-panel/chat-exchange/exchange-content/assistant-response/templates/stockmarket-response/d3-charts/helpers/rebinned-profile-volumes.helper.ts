import type {
  BandGrid,
  HeatmapProfilePoint,
} from './build-heatmap-cells.helper.types';

/** Rebin intraday band volumes onto the global grid by overlap share. */
export function rebinnedProfileVolumes(
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
