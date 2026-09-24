import type { D3ChartPoint } from '../d3-charts/D3Chart.types';
import { mapIntradayBarToPoint } from './map-intraday-bar-to-point.helper';

/** Raw intraday bar as streamed by the eodhdIntraday tool. */
export interface IntradayBar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/** Map raw intraday bars into chart points with UTC timestamps. */
export function buildIntradayChartPoints(bars: IntradayBar[]): D3ChartPoint[] {
  return bars.map(mapIntradayBarToPoint);
}
