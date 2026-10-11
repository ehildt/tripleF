import type { Ref } from 'vue';

import type {
  D3ChartDefaultConfig,
  D3ChartMarker,
  D3ChartPoint,
  D3ReferenceLine,
  D3VolumeProfilePoint,
} from '../D3Chart.types';

export interface UseD3UnifiedChartOptions {
  /** Where the chart canvas mounts (bound by the component's template). */
  containerRef: Ref<HTMLDivElement | null>;
  /** The tooltip panel's root element, exposed by `ChartTooltip`. */
  tooltipRef: Ref<{ rootEl: HTMLElement | null } | null>;
  history: Ref<D3ChartPoint[]>;
  currency?: Ref<string | undefined>;
  referenceLines?: Ref<D3ReferenceLine[] | undefined>;
  markers?: Ref<D3ChartMarker[] | undefined>;
  volumeProfile?: Ref<D3VolumeProfilePoint[] | undefined>;
  /** The ticker's available date range from the cached history database. */
  availableRange?: Ref<{ from: string; to: string } | null | undefined>;
  colormap?: Ref<'turbo' | 'green' | 'purple' | undefined>;
  /** Request older bars from the cached history endpoint before windowing. */
  onRangeRequest?: (bars: number | null) => Promise<void> | void;
  /** Whether the 1D (intraday) view is active. */
  intradayActive?: Ref<boolean | undefined>;
  /** Default style/annotation preferences applied when the chart mounts. */
  initialConfig?: D3ChartDefaultConfig;
  quotePrice?: Ref<number | undefined>;
  quoteChange?: Ref<number | undefined>;
  quoteChangeP?: Ref<number | undefined>;
  /** i18n translate for the tooltip row labels. */
  t: (key: string) => string;
}
