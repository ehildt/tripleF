/** Project a history point into the chart-series point shape. */
export function mapHistoryPoint(p: { time: string; close: number }) {
  return { time: p.time, value: p.close };
}
