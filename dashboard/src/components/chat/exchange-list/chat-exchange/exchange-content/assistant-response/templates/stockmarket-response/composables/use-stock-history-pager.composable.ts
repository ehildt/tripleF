import { computed, type ComputedRef, type Ref, ref, watch } from 'vue';

import {
  fetchStockHistory,
  type StockHistoryPoint,
} from '@/api/stock-data.api';

import { dayBefore } from '../helpers/day-before.helper';
import { mergeBackfill } from '../helpers/merge-backfill.helper';

/**
 * Merges the initially streamed chart history with older bars fetched from
 * the cached history endpoint when the user paginates to a longer range
 * (1W/1M/3M/6M/1Y/All). Fetches are read-through on the server, so repeating
 * a range costs nothing. Single-flight with a monotonic earliest-marker so a
 * range already covered (even yielding zero rows) is never re-requested.
 */
export function useStockHistoryPager(
  ticker: Ref<string | undefined>,
  streamed: Ref<StockHistoryPoint[]>,
): {
  /** All known bars, ascending, deduped by day. */
  history: ComputedRef<StockHistoryPoint[]>;
  loading: Ref<boolean>;
  /** Ensure data back to `from` (YYYY-MM-DD) is loaded. */
  ensureLoadedFrom: (from: string) => Promise<void>;
} {
  const backfill = ref<StockHistoryPoint[]>([]);
  const loading = ref(false);
  const earliestRequested = ref<string | undefined>();
  let inFlight: Promise<void> | undefined;

  // A new ticker (follow-up about another instrument) resets pagination state.
  watch(
    ticker,
    () => {
      backfill.value = [];
      earliestRequested.value = undefined;
    },
    { flush: 'sync' },
  );

  const history = computed<StockHistoryPoint[]>(() => {
    if (backfill.value.length === 0) return streamed.value;
    const byTime = new Map<string, StockHistoryPoint>();
    for (const p of backfill.value) byTime.set(p.time, p);
    for (const p of streamed.value) byTime.set(p.time, p);
    return [...byTime.values()].sort((a, b) => a.time.localeCompare(b.time));
  });

  function earliestKnown(): string | undefined {
    return history.value[0]?.time ?? earliestRequested.value;
  }

  async function ensureLoadedFrom(from: string): Promise<void> {
    const code = ticker.value;
    if (!code) return;
    const floor = earliestRequested.value ?? earliestKnown();
    // Already covered (or already attempted) back to an earlier/equal date.
    if (floor && floor <= from) return;
    if (inFlight) return inFlight;

    const to = dayBefore(floor ?? new Date().toISOString().slice(0, 10));
    earliestRequested.value = from;
    loading.value = true;
    inFlight = fetchStockHistory(code, from, to)
      .then((points) => {
        backfill.value = mergeBackfill(backfill.value, points);
      })
      .catch(() => {
        // Swallow: the marker above prevents a tight refetch loop, and the
        // chart simply keeps its streamed window.
      })
      .finally(() => {
        loading.value = false;
        inFlight = undefined;
      });
    return inFlight;
  }

  return { history, loading, ensureLoadedFrom };
}
