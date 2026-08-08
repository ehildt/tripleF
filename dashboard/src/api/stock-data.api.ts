import { getApiUrl } from './api-url';

/** One daily OHLCV bar as served by the cached history endpoint. */
export interface StockHistoryPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Fetch cached end-of-day history for a ticker in the inclusive [from, to]
 * window (YYYY-MM-DD). The server backfills gaps from the market-data
 * provider, so repeating ranges are free.
 */
export async function fetchStockHistory(
  ticker: string,
  from: string,
  to: string,
): Promise<StockHistoryPoint[]> {
  const params = new URLSearchParams({ ticker, from, to });
  const res = await fetch(
    getApiUrl(`/api/v1/stock-data/history?${params.toString()}`),
  );
  if (!res.ok) {
    throw new Error(`Failed to load stock history: ${res.status}`);
  }
  const body = (await res.json()) as { points?: StockHistoryPoint[] };
  return body.points ?? [];
}

/** The available date range for a ticker, as served by the coverage endpoint. */
export interface StockCoverage {
  from: string;
  to: string;
}

/**
 * Fetch the ticker's available date range from the cached history database
 * (backfilled to the full retention on first access), so the chart's range
 * controls can size themselves to the data that actually exists.
 */
export async function fetchStockCoverage(
  ticker: string,
): Promise<StockCoverage> {
  const params = new URLSearchParams({ ticker });
  const res = await fetch(
    getApiUrl(`/api/v1/stock-data/coverage?${params.toString()}`),
  );
  if (!res.ok) {
    throw new Error(`Failed to load stock coverage: ${res.status}`);
  }
  const body = (await res.json()) as { from?: string; to?: string };
  if (!body.from || !body.to) {
    throw new Error('Stock coverage is empty');
  }
  return { from: body.from, to: body.to };
}
