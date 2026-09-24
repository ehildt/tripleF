import type { StockHistoryPoint } from '@/api/stock-data.api';

/**
 * Merge incoming backfill bars into the existing ones: deduped by day
 * (existing wins) and sorted ascending by time.
 */
export function mergeBackfill(
  existing: StockHistoryPoint[],
  incoming: StockHistoryPoint[],
): StockHistoryPoint[] {
  const seen = new Set(existing.map((p) => p.time));
  const merged = [...existing, ...incoming.filter((p) => !seen.has(p.time))];
  return merged.sort((a, b) => a.time.localeCompare(b.time));
}
