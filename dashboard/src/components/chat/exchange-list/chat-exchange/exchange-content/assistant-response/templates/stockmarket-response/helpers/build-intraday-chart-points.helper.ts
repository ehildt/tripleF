import type { D3ChartPoint } from '../d3-charts/D3Chart.types';

/** Raw intraday bar as streamed by the eodhdIntraday tool. */
export interface IntradayBar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/**
 * EODHD intraday datetimes arrive as UTC "YYYY-MM-DD HH:MM:SS". `new Date()`
 * would parse that space-separated form as the browser's local timezone, so
 * normalize it to an ISO string with an explicit UTC suffix before the chart
 * converts it to a timestamp.
 */
function toUtcIso(time: string): string {
  const normalized = time.includes(' ') ? time.replace(' ', 'T') : time;
  return /(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(normalized)
    ? normalized
    : `${normalized}Z`;
}

/** Map raw intraday bars into chart points with UTC timestamps. */
export function buildIntradayChartPoints(bars: IntradayBar[]): D3ChartPoint[] {
  return bars.map((b) => ({
    time: toUtcIso(b.time),
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
    volume: b.volume ?? 0,
  }));
}
