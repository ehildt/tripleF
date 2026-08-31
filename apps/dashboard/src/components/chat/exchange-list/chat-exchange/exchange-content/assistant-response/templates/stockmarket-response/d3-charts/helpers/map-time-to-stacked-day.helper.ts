/** Build one stacked-area day, carrying forward the last value per series. */
export function mapTimeToStackedDay(
  time: string,
  prepared: Array<Array<{ time: string; value: number }>>,
  lastBySeries: number[],
  hasValue: boolean[],
) {
  const values = prepared.map((points, i) => {
    const point = points.find((p) => p.time === time);
    if (point) {
      lastBySeries[i] = point.value;
      hasValue[i] = true;
      return point.value;
    }
    return hasValue[i] ? lastBySeries[i] : 0;
  });
  return { time, values };
}
