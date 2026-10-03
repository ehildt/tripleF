import type {
  BandGrid,
  HeatmapHistoryPoint,
} from './build-heatmap-cells.helper.types';
import { touchedBandIndices } from './touched-band-indices.helper';

/** Share a day's volume evenly across the bands its price range touched. */
export function dailyVolumes(
  day: HeatmapHistoryPoint,
  grid: BandGrid,
): number[] {
  const volumes = new Array<number>(grid.bandCount).fill(0);
  const touched = touchedBandIndices(day, grid);
  const share = touched.length > 0 ? day.volume / touched.length : 0;
  for (const i of touched) volumes[i] = share;
  return volumes;
}
