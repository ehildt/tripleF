import { Module } from '@nestjs/common';

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
@Module({
  controllers: [StockDataController],
  providers: [
    StockHistoryService,
    StockHistoryRepository,
    EodhdHistoryProvider,
    { provide: MARKET_HISTORY_PROVIDER, useExisting: EodhdHistoryProvider },
  ],
  exports: [StockHistoryService],
})
export class StockDataModule {}
