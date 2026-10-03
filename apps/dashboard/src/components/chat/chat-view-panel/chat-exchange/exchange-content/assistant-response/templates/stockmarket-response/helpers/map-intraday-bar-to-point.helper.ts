import type { D3ChartPoint } from '../d3-charts/D3Chart.types';
import { toUtcIso } from './to-utc-iso.helper';

/** A raw intraday bar from the EODHD intraday tool. */
type IntradayBar = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

/** Map one raw intraday bar into a chart point with a UTC timestamp. */
export function mapIntradayBarToPoint(b: IntradayBar): D3ChartPoint {
  return {
    time: toUtcIso(b.time),
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
    volume: b.volume ?? 0,
  };
}
