import type {
  HeatmapHistoryPoint,
  HeatmapProfilePoint,
} from './build-heatmap-cells.helper';

interface BandGrid {
  minPrice: number;
  step: number;
  bandCount: number;
}

/** Build one heatmap row (day → volumes) from its profile or daily range. */
export function mapDayToHeatmapRow(
  day: HeatmapHistoryPoint,
  profileByDay: Map<string, HeatmapProfilePoint>,
  grid: BandGrid,
  rebinnedProfileVolumes: (
    bands: HeatmapProfilePoint['bands'],
    grid: BandGrid,
  ) => number[],
  dailyVolumes: (day: HeatmapHistoryPoint, grid: BandGrid) => number[],
) {
  const profile = profileByDay.get(day.time);
  return {
    time: day.time,
    volumes: profile
      ? rebinnedProfileVolumes(profile.bands, grid)
      : dailyVolumes(day, grid),
  };
}
