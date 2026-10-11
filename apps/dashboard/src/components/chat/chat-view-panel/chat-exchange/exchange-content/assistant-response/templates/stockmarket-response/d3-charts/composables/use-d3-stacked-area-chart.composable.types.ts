import type { Ref } from 'vue';

import type { D3StackedAreaSeries } from '../D3Chart.types';

export interface UseD3StackedAreaChartOptions {
  /** Where the chart canvas mounts (bound by the component's template). */
  containerRef: Ref<HTMLDivElement | null>;
  series: Ref<D3StackedAreaSeries[]>;
  /** normalized = each series rebased to 100; raw = original values. */
  mode?: Ref<'normalized' | 'raw' | undefined>;
  /** Request older bars from the cached history endpoint before windowing. */
  onRangeRequest?: (bars: number | null) => Promise<void> | void;
}
