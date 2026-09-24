import { flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

import type { StockHistoryPoint } from '@/api/stock-data.api';

import { useStockmarketItemData } from './use-stockmarket-item-data.composable';

const fetchStockHistory = vi.hoisted(() =>
  vi.fn<
    (t: string, from: string, to: string) => Promise<StockHistoryPoint[]>
  >(),
);

vi.mock('@/api/stock-data.api', () => ({ fetchStockHistory }));
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

function point(time: string, close = 1): StockHistoryPoint {
  return { time, open: close, high: close, low: close, close, volume: 1 };
}

function intradayBar(time: string) {
  return { time, open: 1, high: 1, low: 1, close: 1, volume: 1 };
}

function makeProps(overrides: Record<string, unknown> = {}) {
  return reactive({
    data: undefined,
    chartData: undefined,
    revealCharts: false,
    ...overrides,
  });
}

function chartDataWithIntraday() {
  return {
    'eodhdHistory:NVDA.US': { history: [point('2026-01-02')] },
    'eodhdIntraday:NVDA.US': {
      bars: [intradayBar('2026-01-02 09:30:00')],
    },
  };
}

describe('useStockmarketItemData', () => {
  beforeEach(() => {
    fetchStockHistory.mockReset();
  });

  it('extracts the streamed history from the chart data', () => {
    const props = makeProps({
      chartData: { 'eodhdHistory:NVDA.US': { history: [point('2026-01-02')] } },
    });
    const { displayHistory } = useStockmarketItemData(props);
    expect(displayHistory.value).toHaveLength(1);
  });

  it('toggles into the intraday view when intraday bars exist', () => {
    const props = makeProps({ chartData: chartDataWithIntraday() });
    const { displayHistory, intradayActive, toggleIntraday } =
      useStockmarketItemData(props);

    expect(intradayActive.value).toBe(false);
    toggleIntraday();
    expect(intradayActive.value).toBe(true);
    expect(displayHistory.value).toHaveLength(1);
  });

  it('ignores the intraday toggle when no intraday bars are available', () => {
    const props = makeProps({
      chartData: { 'eodhdHistory:NVDA.US': { history: [point('2026-01-02')] } },
    });
    const { intradayActive, toggleIntraday } = useStockmarketItemData(props);

    toggleIntraday();
    expect(intradayActive.value).toBe(false);
  });

  it('resets the intraday view when the ticker changes', async () => {
    const props = makeProps({ chartData: chartDataWithIntraday() });
    const { intradayActive, toggleIntraday } = useStockmarketItemData(props);

    toggleIntraday();
    expect(intradayActive.value).toBe(true);

    props.chartData = {
      'eodhdHistory:AMD.US': { history: [point('2026-01-02')] },
    };
    await flushPromises();
    expect(intradayActive.value).toBe(false);
  });

  it('shows the chart only after revealCharts with streamed history', () => {
    const props = makeProps({
      revealCharts: true,
      chartData: { 'eodhdHistory:NVDA.US': { history: [point('2026-01-02')] } },
    });
    const { showChart } = useStockmarketItemData(props);
    expect(showChart.value).toBe(true);
  });

  it('hides the chart until revealCharts', () => {
    const props = makeProps({
      chartData: { 'eodhdHistory:NVDA.US': { history: [point('2026-01-02')] } },
    });
    const { showChart } = useStockmarketItemData(props);
    expect(showChart.value).toBe(false);
  });

  it('shows the panels when fundamentals or key points exist', () => {
    const props = makeProps({ data: { keyPoints: [{ text: 'x' }] } });
    const { showPanels } = useStockmarketItemData(props);
    expect(showPanels.value).toBe(true);
  });

  it('hides the panels when nothing is present', () => {
    const props = makeProps({ data: {} });
    const { showPanels } = useStockmarketItemData(props);
    expect(showPanels.value).toBe(false);
  });

  it('builds the news heading from what is present', () => {
    const props = makeProps({
      data: {
        news: [{ title: 'a' }],
        sources: [{ title: 'b' }],
      },
    });
    const { newsHeading } = useStockmarketItemData(props);
    expect(newsHeading.value).toBe('common.sources');
  });

  it('leaves the intraday view when a daily range is requested', async () => {
    const props = makeProps({ chartData: chartDataWithIntraday() });
    fetchStockHistory.mockResolvedValue([]);
    const { intradayActive, toggleIntraday, onRangeRequest } =
      useStockmarketItemData(props);

    toggleIntraday();
    expect(intradayActive.value).toBe(true);

    await onRangeRequest(66);
    expect(intradayActive.value).toBe(false);
  });
});
