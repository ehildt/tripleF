import type { D3StackedAreaSeries } from './D3Chart.types';

/** Props for `D3StackedAreaChart`, the normalized stacked-area chart. */
export interface D3StackedAreaChartProps {
  /** The series to stack and render. */
  series: D3StackedAreaSeries[];
  /** normalized = each series rebased to 100; raw = original values. */
  mode?: 'normalized' | 'raw';
}
