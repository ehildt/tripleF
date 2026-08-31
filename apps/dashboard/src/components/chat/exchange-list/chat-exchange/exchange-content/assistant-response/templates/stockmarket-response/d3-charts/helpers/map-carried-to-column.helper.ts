interface DayStats {
  total: number;
  centroid: number;
  spread: number;
}

/** Build one smoothed flow column from the carried day stats. */
export function mapCarriedToColumn(
  _: unknown,
  i: number,
  carried: Array<DayStats | null>,
  firstStat: DayStats | null,
  smoothingWindow: number,
  minHalfWidth: number,
  stats: Array<DayStats | null>,
  maxTotal: number,
) {
  const window = carried
    .slice(Math.max(0, i - smoothingWindow + 1), i + 1)
    .map((s) => s ?? firstStat)
    .filter((s): s is DayStats => s !== null);
  const centroid =
    window.reduce((sum, s) => sum + s.centroid, 0) / (window.length || 1);
  const halfWidth = Math.max(
    window.reduce((sum, s) => sum + s.spread, 0) / (window.length || 1),
    minHalfWidth,
  );
  return {
    centroid,
    halfWidth,
    intensity: (stats[i]?.total ?? 0) / maxTotal,
  };
}
