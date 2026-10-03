/** A single EODHD history datapoint: its day and closing price. */
type HistoryPoint = {
  time: string;
  close: number;
};

/** Project a history point into the chart-series point shape. */
export function mapHistoryPoint(p: HistoryPoint) {
  return { time: p.time, value: p.close };
}
