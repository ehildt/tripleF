import { mapPointToNormalizedValue } from './map-point-to-normalized-value.helper';
import { mapPointToRawValue } from './map-point-to-raw-value.helper';
import { mapTimeToStackedDay } from './map-time-to-stacked-day.helper';

/** One day of the stacked-area chart with one value per series. */
export interface StackedAreaDay {
  time: string;
  values: number[];
}

/** One named series of the stacked-area chart. */
export interface StackedAreaInputSeries {
  points: Array<{ time: string; value: number }>;
}

/**
 * Build stacked-area data across all series. Each series is normalized to
 * 100 at its first point so different instruments (different price scales)
 * can be compared, then stacked. Missing dates are carried forward from the
 * last known value per series. Ported from the lightweight-charts stacked-
 * area chart.
 */
export function buildStackedAreaData(
  series: StackedAreaInputSeries[],
  mode: 'normalized' | 'raw',
): StackedAreaDay[] {
  const allTimes = new Set<string>();
  for (const s of series) {
    for (const p of s.points) allTimes.add(p.time);
  }
  const times = [...allTimes].sort((a, b) => a.localeCompare(b));

  // Raw mode uses the original values; normalized rebases each series to 100
  // at its first point so different price scales can be compared.
  const prepared = series.map((s) => {
    if (mode === 'raw') {
      return s.points.map(mapPointToRawValue);
    }
    const base = s.points[0]?.value ?? 0;
    return s.points.map((p) => mapPointToNormalizedValue(p, base));
  });

  const lastBySeries: number[] = prepared.map(() => 0);
  const hasValue: boolean[] = prepared.map(() => false);

  return times.map((time) =>
    mapTimeToStackedDay(time, prepared, lastBySeries, hasValue),
  );
}
