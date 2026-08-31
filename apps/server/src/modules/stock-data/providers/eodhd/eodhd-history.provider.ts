import { Injectable } from '@nestjs/common';

import { ProviderOverridesService } from '../../../provider-overrides/services/provider-overrides.service.js';
import {
  type MarketDailyBar,
  MarketHistoryFetchError,
  type MarketHistoryProvider,
  MarketHistoryUnavailableError,
} from '../../market-data.types.js';

import { mapEodhdPointToDailyBar } from './helpers/map-eodhd-point-to-daily-bar.helper.js';
import {
  EodhdApiError,
  EodhdClient,
  EodhdRateLimitError,
} from './eodhd-client.js';

/**
 * EODHD-backed market-history provider. Resolve the live config on every
 * call (like the tools do) so runtime key/override changes apply without a
 * restart. Vendor types never leak past the map at the bottom.
 */
@Injectable()
export class EodhdHistoryProvider implements MarketHistoryProvider {
  readonly providerId = 'eodhd';

  constructor(private readonly providerOverrides: ProviderOverridesService) {}

  isAvailable(): boolean {
    const cfg = this.providerOverrides.getConfig().eodhd;
    return !!cfg?.enabled && !!cfg.apiKey && !!cfg.history?.enabled;
  }

  async fetchDailyBars(
    ticker: string,
    from: string,
    to: string,
  ): Promise<MarketDailyBar[]> {
    const cfg = this.providerOverrides.getConfig().eodhd;
    if (!cfg?.enabled || !cfg.apiKey || !cfg.history?.enabled) {
      throw new MarketHistoryUnavailableError(
        'EODHD history is not enabled or no API key configured',
      );
    }
    const client = new EodhdClient(cfg.apiKey);
    try {
      const points = await client.history(ticker, { period: 'd', from, to });
      return points.map(mapEodhdPointToDailyBar);
    } catch (err) {
      throw new MarketHistoryFetchError(
        err instanceof Error ? err.message : String(err),
        this.providerId,
        err instanceof EodhdRateLimitError ||
          (err instanceof EodhdApiError && err.status === 429),
      );
    }
  }
}
