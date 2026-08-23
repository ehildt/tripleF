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
      return s.points.map((p) => ({ time: p.time, value: p.value }));
    }
    const base = s.points[0]?.value ?? 0;
    return s.points.map((p) => ({
      time: p.time,
      value: base !== 0 ? (p.value / base) * 100 : 0,
    }));
  });

  const lastBySeries: number[] = prepared.map(() => 0);
  const hasValue: boolean[] = prepared.map(() => false);

  return times.map((time) => {
    const values = prepared.map((points, i) => {
      const point = points.find((p) => p.time === time);
      if (point) {
        lastBySeries[i] = point.value;
        hasValue[i] = true;
        return point.value;
      }
      // Carry forward the last known value (0 until the series starts).
      return hasValue[i] ? lastBySeries[i] : 0;
    });
    return { time, values };
  });
}
