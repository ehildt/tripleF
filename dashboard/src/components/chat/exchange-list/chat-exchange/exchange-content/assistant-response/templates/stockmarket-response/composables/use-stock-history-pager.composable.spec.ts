import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import type { StockHistoryPoint } from '@/api/stock-data.api';

import { useStockHistoryPager } from './use-stock-history-pager.composable';

const fetchStockHistory = vi.hoisted(() =>
  vi.fn<
    (t: string, from: string, to: string) => Promise<StockHistoryPoint[]>
  >(),
);

vi.mock('@/api/stock-data.api', () => ({ fetchStockHistory }));

function point(time: string, close = 1): StockHistoryPoint {
  return { time, open: close, high: close, low: close, close, volume: 1 };
}

describe('useStockHistoryPager', () => {
  beforeEach(() => {
    fetchStockHistory.mockReset();
  });

  it('starts with the streamed history only', () => {
    const ticker = ref('NVDA.US');
    const streamed = ref([point('2026-05-01'), point('2026-08-01')]);
    const pager = useStockHistoryPager(ticker, streamed);

    expect(pager.history.value.map((p) => p.time)).toEqual([
      '2026-05-01',
      '2026-08-01',
    ]);
  });

  it('fetches older bars and merges them ascending without duplicates', async () => {
    const ticker = ref('NVDA.US');
    const streamed = ref([point('2026-06-01'), point('2026-08-01')]);
    fetchStockHistory.mockResolvedValue([
      point('2026-03-01'),
      point('2026-06-01'), // overlaps the streamed window — must dedupe
    ]);

    const pager = useStockHistoryPager(ticker, streamed);
    await pager.ensureLoadedFrom('2026-03-01');

    expect(fetchStockHistory).toHaveBeenCalledTimes(1);
    expect(fetchStockHistory.mock.calls[0][0]).toBe('NVDA.US');
    expect(pager.history.value.map((p) => p.time)).toEqual([
      '2026-03-01',
      '2026-06-01',
      '2026-08-01',
    ]);
  });

  it('does not refetch a range that is already covered or attempted', async () => {
    const ticker = ref('NVDA.US');
    const streamed = ref([point('2026-06-01')]);
    fetchStockHistory.mockResolvedValue([point('2026-03-01')]);

    const pager = useStockHistoryPager(ticker, streamed);
    await pager.ensureLoadedFrom('2026-03-01');
    await pager.ensureLoadedFrom('2026-04-01'); // inside the covered window

    expect(fetchStockHistory).toHaveBeenCalledTimes(1);
  });

  it('marks an empty result as covered to avoid refetch loops', async () => {
    const ticker = ref('NVDA.US');
    const streamed = ref([point('2026-06-01')]);
    fetchStockHistory.mockResolvedValue([]);

    const pager = useStockHistoryPager(ticker, streamed);
    await pager.ensureLoadedFrom('2026-01-01');
    await pager.ensureLoadedFrom('2026-01-01');

    expect(fetchStockHistory).toHaveBeenCalledTimes(1);
  });

  it('resets pagination state when the ticker changes', async () => {
    const ticker = ref<string | undefined>('NVDA.US');
    const streamed = ref([point('2026-06-01')]);
    fetchStockHistory.mockResolvedValue([point('2026-03-01')]);

    const pager = useStockHistoryPager(ticker, streamed);
    await pager.ensureLoadedFrom('2026-03-01');

    ticker.value = 'AMD.US';
    await pager.ensureLoadedFrom('2026-03-01');

    expect(fetchStockHistory).toHaveBeenCalledTimes(2);
    expect(fetchStockHistory.mock.calls[1][0]).toBe('AMD.US');
  });
});
