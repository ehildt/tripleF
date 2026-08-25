import type { ToolConfigSnapshot } from './config.types.js';

/**
 * Minimal logger surface the tools need — the server's NestJS Logger satisfies
 * it structurally, so the tools stay decoupled from @nestjs/common.
 */
export interface ToolLogger {
  log: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  debug?: (message: string, ...args: unknown[]) => void;
}

/** A single end-of-day OHLCV bar, provider-agnostic. */
export interface MarketDailyBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose?: number;
  volume: number;
}

export interface ToolDependencies {
  getLiveConfig: () => ToolConfigSnapshot;
  logger: ToolLogger;
  model?: string;
  notify?: (event: string, data?: unknown) => void;
  /**
   * Read-through access to the cached market-history store: returns daily
   * bars for the inclusive [from, to] window (YYYY-MM-DD), backfilling gaps
   * from the configured provider. Undefined when the cache is not wired
   * (e.g. isolated tool tests).
   */
  getOrFetchHistory?: (ticker: string, from: string, to: string) => Promise<MarketDailyBar[]>;
  /**
   * Fallback locale (two-letter code of the detected user language) applied
   * when the model omits a tool's lang input. Threaded from the intent
   * classifier; nothing is hardcoded.
   */
  defaultLang?: string;
}
