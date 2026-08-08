import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { fetchStockCoverage, type StockCoverage } from '@/api/stock-data.api';

import { useStockHistoryPager } from '../../stockmarket-response/composables/use-stock-history-pager.composable';
import type {
  D3ChartPoint,
  D3VolumeProfilePoint,
} from '../../stockmarket-response/d3-charts/D3Chart.types';
import { buildFundamentalEntries } from '../../stockmarket-response/helpers/build-fundamental-entries.helper';
import {
  buildIntradayChartPoints,
  type IntradayBar,
} from '../../stockmarket-response/helpers/build-intraday-chart-points.helper';
import { dedupeMarkers } from '../../stockmarket-response/helpers/dedupe-markers.helper';
import { filterReferenceLinesAtPrice } from '../../stockmarket-response/helpers/filter-reference-lines-at-price.helper';
import { mergeNewsSources } from '../../stockmarket-response/helpers/merge-news-sources.helper';
import { resolveHistoryRange } from '../../stockmarket-response/helpers/resolve-history-range.helper';
import { resolveLookbackFrom } from '../../stockmarket-response/helpers/resolve-lookback-from.helper';
import type { StockmarketItemResponseProps } from '../StockmarketItemResponse.types';

/**
 * Derives every display value of the single-instrument stock card from the
 * raw response: the streamed/paginated history, the intraday 1D view, the
 * volume profile, reference lines, markers, fundamentals, panels/chart
 * visibility, and the merged news & sources list with its heading.
 */
export function useStockmarketItemData(props: StockmarketItemResponseProps) {
  const { t } = useI18n();

  /** Ticker of the streamed history series (keys are `tool:ticker`). */
  const ticker = computed(() => {
    const key = Object.keys(props.chartData ?? {}).find((k) =>
      k.startsWith('eodhdHistory:'),
    );
    return key ? key.slice('eodhdHistory:'.length) : undefined;
  });

  const streamedHistory = computed<D3ChartPoint[]>(() => {
    const entry = Object.entries(props.chartData ?? {}).find(([key]) =>
      key.startsWith('eodhdHistory:'),
    )?.[1] as { history?: D3ChartPoint[] } | undefined;
    return entry?.history ?? [];
  });

  /** Streamed history plus older bars fetched on range change. */
  const pager = useStockHistoryPager(ticker, streamedHistory);
  const history = pager.history;

  /**
   * The ticker's available date range from the cached history database, so
   * the chart's range controls reflect the data that actually exists rather
   * than the lazily loaded window.
   */
  const coverage = ref<StockCoverage | null>(null);
  watch(
    ticker,
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
   * coverage endpoint is unreachable, the loaded DAILY history's span is the
   * fallback — never the displayed series, which in the 1D intraday view
   * spans a single day and would collapse the range buttons mid-interaction.
   */
  const coverageForChart = computed<StockCoverage | null>(
    () => coverage.value ?? resolveHistoryRange(history.value),
  );

  /** Intraday bars for the 1D view, streamed by the eodhdIntraday tool. */
  const intradayBars = computed<D3ChartPoint[]>(() => {
    const entry = Object.entries(props.chartData ?? {}).find(([key]) =>
      key.startsWith('eodhdIntraday:'),
    )?.[1] as { bars?: IntradayBar[] } | undefined;
    return buildIntradayChartPoints(entry?.bars ?? []);
  });

  /** Whether the price charts show the 1D intraday view. */
  const intradayActive = ref(false);

  /**
   * Whether the 1D view is available (intraday bars were streamed). The 1D
   * button renders disabled when false instead of silently doing nothing.
   */
  const intradayAvailable = computed(() => intradayBars.value.length > 0);

  /** The series the price charts render: intraday bars in 1D, else daily. */
  const displayHistory = computed(() =>
    intradayActive.value ? intradayBars.value : history.value,
  );

  // A new instrument resets the 1D toggle so it never lingers across tickers.
  watch(ticker, () => {
    intradayActive.value = false;
  });

  function onRangeRequest(bars: number | null): Promise<void> {
    // Selecting a daily range (or All) leaves the 1D intraday view.
    intradayActive.value = false;
    return pager.ensureLoadedFrom(resolveLookbackFrom(bars));
  }

  function toggleIntraday(): void {
    // Only switch when intraday bars are actually available — otherwise the
    // 1D view would go blank and the range highlight would jump around.
    if (intradayBars.value.length === 0) return;
    intradayActive.value = !intradayActive.value;
  }

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

  /** Fundamentals flattened into display-ready label/value pairs. */
  const fundamentalEntries = computed(() =>
    buildFundamentalEntries(props.data?.fundamentals),
  );

  /** Fundamentals and key findings share a two-panel row below the chart. */
  const showPanels = computed(
    () =>
      fundamentalEntries.value.length > 0 ||
      (props.data?.keyPoints?.length ?? 0) > 0,
  );

  /** The chart stays hidden until the respond step starts streaming. */
  const showChart = computed(
    () => props.revealCharts === true && history.value.length > 0,
  );

  /** News and sources merged into one deduplicated list. */
  const mergedItems = computed(() =>
    mergeNewsSources(props.data?.news, props.data?.sources),
  );

  /** Section heading adapts to what is actually present. */
  const newsHeading = computed(() => {
    const hasNews = (props.data?.news?.length ?? 0) > 0;
    const hasSources = (props.data?.sources?.length ?? 0) > 0;
    if (hasNews && hasSources) return t('common.sources');
    if (hasNews) return t('common.newsList');
    return t('common.sources');
  });

  return {
    displayHistory,
    intradayActive,
    intradayAvailable,
    volumeProfile,
    referenceLines,
    markers,
    coverage,
    coverageForChart,
    fundamentalEntries,
    showPanels,
    showChart,
    mergedItems,
    newsHeading,
    onRangeRequest,
    toggleIntraday,
  };
}
