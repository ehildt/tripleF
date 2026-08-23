import type { Logger } from '@nestjs/common';

import type { ProviderOverridesSnapshot } from '../../../provider-overrides/services/provider-overrides.service.js';
import type { MarketDailyBar } from '../../../stock-data/market-data.types.js';

export interface ToolDependencies {
  getLiveConfig: () => ProviderOverridesSnapshot;
  logger: Logger;
  compactContent: (
    content: string,
    opts?: { model?: string; notify?: (event: string, data?: unknown) => void },
  ) => Promise<{ text: string }>;
  model?: string;
  notify?: (event: string, data?: unknown) => void;
  /**
   * Read-through access to the cached market-history store: returns daily
   * bars for the inclusive [from, to] window (YYYY-MM-DD), backfilling gaps
   * from the configured provider. Undefined when the cache is not wired
   * (e.g. isolated tool tests).
   */
  getOrFetchHistory?: (
    ticker: string,
    from: string,
    to: string,
  ) => Promise<MarketDailyBar[]>;
  /**
   * Fallback locale (two-letter code of the detected user language) applied
   * when the model omits a tool's lang input. Threaded from the intent
   * classifier; nothing is hardcoded.
   */
  defaultLang?: string;
}
