import { computed, ref, watch } from 'vue';

import { fetchStockCoverage, type StockCoverage } from '@/api/stock-data.api';

import { useStockHistoryPager } from '../../stockmarket-response/composables/use-stock-history-pager.composable';
import type {
  D3ChartPoint,
  D3StackedAreaSeries,
  D3VolumeProfilePoint,
} from '../../stockmarket-response/d3-charts/D3Chart.types';
import { dedupeMarkers } from '../../stockmarket-response/helpers/dedupe-markers.helper';
import { filterReferenceLinesAtPrice } from '../../stockmarket-response/helpers/filter-reference-lines-at-price.helper';
import { resolveHistoryRange } from '../../stockmarket-response/helpers/resolve-history-range.helper';
import { resolveLookbackFrom } from '../../stockmarket-response/helpers/resolve-lookback-from.helper';
import type { StockmarketListResponseProps } from '../StockmarketListResponse.types';
import { mapHistoryPoint } from './helpers/map-history-point.helper';

/**
 * Derives the stockmarket-list template's display values from the raw
 * response: the per-instrument chart series, the ticker selector, the
 * paginated history, reference lines, markers, and the chart tabs.
 */
export function useStockmarketListData(props: StockmarketListResponseProps) {
  /** Collect every streamed history series (one per instrument) for the chart. */
  const chartSeries = computed<D3StackedAreaSeries[]>(() => {
    const series: D3StackedAreaSeries[] = [];
    for (const [key, value] of Object.entries(props.chartData ?? {})) {
      if (!key.startsWith('eodhdHistory:')) continue;
      const entry = value as {
        ticker?: string;
        history?: Array<{ time: string; close: number }>;
      };
      if (!entry?.history?.length) continue;
      series.push({
        name: entry.ticker ?? key.slice('eodhdHistory:'.length),
        points: entry.history.map(mapHistoryPoint),
      });
    }
    return series;
  });

  /** The chart stays hidden until the respond step starts streaming. */
  const showChart = computed(
    () => props.revealCharts === true && chartSeries.value.length > 0,
  );

  /** Which single full-width diagram is currently shown. */
  const activeChart = ref<'overview' | 'stacked'>('overview');

  /** Every streamed instrument (one per `eodhdHistory:` series). */
  const tickers = computed<string[]>(() =>
    Object.keys(props.chartData ?? {})
      .filter((k) => k.startsWith('eodhdHistory:'))
      .map((k) => k.slice('eodhdHistory:'.length)),
  );

  /** Instrument shown in the single-instrument candlestick / heatmap / HLC tabs. */
  const selectedTicker = ref<string | undefined>(tickers.value[0]);

  const streamedHistory = computed<D3ChartPoint[]>(() => {
    const key = selectedTicker.value
      ? `eodhdHistory:${selectedTicker.value}`
      : undefined;
    const entry = key
      ? (props.chartData?.[key] as { history?: D3ChartPoint[] } | undefined)
      : undefined;
    return entry?.history ?? [];
  });

  const pager = useStockHistoryPager(selectedTicker, streamedHistory);
  const history = pager.history;

  /**
   * The selected instrument's available date range from the cached history
   * database, so the chart's range controls reflect the data that actually
   * exists rather than the lazily loaded window.
   */
  const coverage = ref<StockCoverage | null>(null);
  watch(
    selectedTicker,
    async (code) => {
      coverage.value = null;
      if (!code) return;
      try {
        coverage.value = await fetchStockCoverage(code);
      } catch {
        coverage.value = null;
      }
    },
    { immediate: true },
  );

  /**
   * The range the chart's controls size to: the DB coverage wins; when the
   * coverage endpoint is unreachable, the loaded history's span is the
   * fallback.
   */
  const coverageForChart = computed<StockCoverage | null>(
    () => coverage.value ?? resolveHistoryRange(history.value),
  );

  function onRangeRequest(bars: number | null): Promise<void> {
    return pager.ensureLoadedFrom(resolveLookbackFrom(bars));
  }

  /** Per-day, per-price-band volume from the EODHD intraday tool. */
  const volumeProfile = computed<D3VolumeProfilePoint[]>(() => {
    const entry = Object.entries(props.chartData ?? {}).find(([key]) =>
      key.startsWith('eodhdIntraday:'),
    )?.[1] as { volumeProfile?: D3VolumeProfilePoint[] } | undefined;
    return entry?.volumeProfile ?? [];
  });

  const referenceLines = computed(() =>
    filterReferenceLinesAtPrice(
      props.data?.referenceLines ?? [],
      props.data?.currentPrice,
    ),
  );
  const markers = computed(() => dedupeMarkers(props.data?.markers ?? []));

  const chartTabs = [
    { id: 'overview', label: 'Chart' },
    { id: 'stacked', label: 'Stacked area' },
  ];

  return {
    chartSeries,
    showChart,
    activeChart,
    tickers,
    selectedTicker,
    history,
    coverageForChart,
    onRangeRequest,
    volumeProfile,
    referenceLines,
    markers,
    chartTabs,
  };
}
