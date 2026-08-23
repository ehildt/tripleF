/**
 * Provider-agnostic stock-market domain types. The cache, the charts, and
 * the indicator math all speak these shapes; vendor modules (e.g. EODHD
 * under `providers/eodhd/`) adapt their raw payloads into them.
 */

/** A single end-of-day OHLCV bar. */
export interface MarketDailyBar {
  /** Trading date, YYYY-MM-DD. */
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose?: number;
  volume: number;
}

/** The chart-facing shape the dashboard consumes (streamed or via REST). */
export interface StockHistoryPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** A provider that can fetch daily bars for the inclusive [from, to] window. */
export interface MarketHistoryProvider {
  /** Whether the provider is configured (enabled + credentials present). */
  isAvailable(): boolean;
  /** Which vendor backs this provider (e.g. "eodhd"), for error messages. */
  readonly providerId: string;
  fetchDailyBars(
    ticker: string,
    from: string,
    to: string,
  ): Promise<MarketDailyBar[]>;
}

/** Injection token for the active market-history provider. */
export const MARKET_HISTORY_PROVIDER = Symbol('MARKET_HISTORY_PROVIDER');

/** No market-history provider is configured (disabled or missing key). */
export class MarketHistoryUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MarketHistoryUnavailableError';
  }
}

/** A configured provider failed to deliver data (network, quota, auth). */
export class MarketHistoryFetchError extends Error {
  constructor(
    message: string,
    readonly provider: string,
    readonly rateLimited: boolean,
  ) {
    super(message);
    this.name = 'MarketHistoryFetchError';
  }
}
