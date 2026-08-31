import type { D3ChartPoint } from '../d3-charts/D3Chart.types';

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

/** Map one raw intraday bar into a chart point with a UTC timestamp. */
export function mapIntradayBarToPoint(b: {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}): D3ChartPoint {
  return {
    time: toUtcIso(b.time),
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
    volume: b.volume ?? 0,
  };
}
