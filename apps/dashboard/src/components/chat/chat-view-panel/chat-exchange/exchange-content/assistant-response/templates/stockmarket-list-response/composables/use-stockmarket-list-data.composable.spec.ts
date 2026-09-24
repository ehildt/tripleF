import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

import type { StockHistoryPoint } from '@/api/stock-data.api';

import type { StockmarketListResponseProps } from '../StockmarketListResponse.types';
import { useStockmarketListData } from './use-stockmarket-list-data.composable';

const fetchStockHistory = vi.hoisted(() =>
  vi.fn<
    (t: string, from: string, to: string) => Promise<StockHistoryPoint[]>
  >(),
);

vi.mock('@/api/stock-data.api', () => ({ fetchStockHistory }));

function point(time: string, close = 1): StockHistoryPoint {
  return { time, open: close, high: close, low: close, close, volume: 1 };
}

function makeProps(
  overrides: Partial<StockmarketListResponseProps> = {},
): StockmarketListResponseProps {
  return reactive({
    data: undefined,
    chartData: undefined,
    revealCharts: false,
    ...overrides,
  });
}

describe('useStockmarketListData', () => {
  beforeEach(() => {
    fetchStockHistory.mockReset();
  });

  it('collects one series per streamed instrument', () => {
    const props = makeProps({
      chartData: {
        'eodhdHistory:NVDA.US': {
          ticker: 'NVDA.US',
          history: [point('2026-01-02', 10)],
        },
        'eodhdHistory:AMD.US': {
          history: [point('2026-01-02', 5)],
        },
      },
    });
    const { chartSeries } = useStockmarketListData(props);
    expect(chartSeries.value.map((s) => s.name)).toEqual(['NVDA.US', 'AMD.US']);
  });

  it('lists every streamed ticker for the selector', () => {
    const props = makeProps({
      chartData: {
        'eodhdHistory:NVDA.US': { history: [point('2026-01-02')] },
        'eodhdHistory:AMD.US': { history: [point('2026-01-02')] },
      },
    });
    const { tickers } = useStockmarketListData(props);
    expect(tickers.value).toEqual(['NVDA.US', 'AMD.US']);
  });

  it('shows the chart only after revealCharts with a series', () => {
    const props = makeProps({
      revealCharts: true,
      chartData: { 'eodhdHistory:NVDA.US': { history: [point('2026-01-02')] } },
    });
    const { showChart } = useStockmarketListData(props);
    expect(showChart.value).toBe(true);
  });

  it('hides the chart until revealCharts', () => {
    const props = makeProps({
      chartData: { 'eodhdHistory:NVDA.US': { history: [point('2026-01-02')] } },
    });
    const { showChart } = useStockmarketListData(props);
    expect(showChart.value).toBe(false);
  });

  it('defaults the selected ticker to the first streamed one', () => {
    const props = makeProps({
      chartData: {
        'eodhdHistory:NVDA.US': { history: [point('2026-01-02')] },
        'eodhdHistory:AMD.US': { history: [point('2026-01-02')] },
      },
    });
    const { selectedTicker, history } = useStockmarketListData(props);
    expect(selectedTicker.value).toBe('NVDA.US');
    expect(history.value).toHaveLength(1);
  });
});
