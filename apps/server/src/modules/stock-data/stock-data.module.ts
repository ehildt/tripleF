import { DynamicModule, Module } from '@nestjs/common';

import { DeadLetterModule } from '../dead-letter/dead-letter.module.js';
import { ProviderOverridesModule } from '../provider-overrides/provider-overrides.module.js';

import { StockDataController } from './controllers/stock-data.controller.js';
import { EodhdHistoryProvider } from './providers/eodhd/eodhd-history.provider.js';
import { StockHistoryRepository } from './services/stock-history.repository.js';
import { StockHistoryService } from './services/stock-history.service.js';
import { MARKET_HISTORY_PROVIDER } from './market-data.types.js';

/**
 * Provider-agnostic stock-market data: a Postgres cache of end-of-day bars,
 * gap backfill from the configured market-data provider, locally computed
 * technical indicators, and a REST endpoint the dashboard paginates
 * against. Vendors plug in under `providers/`; the domain never names them.
 */
@Module({})
export class StockDataModule {
  private static readonly registration: DynamicModule = {
    module: StockDataModule,
    controllers: [StockDataController],
    exports: [StockHistoryService],
    imports: [DeadLetterModule.register(), ProviderOverridesModule.register()],
    providers: [
      StockHistoryService,
      StockHistoryRepository,
      EodhdHistoryProvider,
      { provide: MARKET_HISTORY_PROVIDER, useExisting: EodhdHistoryProvider },
    ],
  };

  /**
   * Shared registration object: this app uses Nest's default by-reference
   * dynamic-module ids, so one object per module class keeps multi-site
   * imports a single shared instance (static-module singleton semantics).
   */
  static register(): DynamicModule {
    return StockDataModule.registration;
  }
}
