import { Inject, Injectable, Logger } from '@nestjs/common';

import { computeMissingRanges } from '../helpers/compute-missing-ranges.helper.js';
import {
  addDays,
  type DateRange,
  utcToday,
} from '../helpers/date-range.helper.js';
import { mergeDateRanges } from '../helpers/merge-date-ranges.helper.js';
import {
  MARKET_HISTORY_PROVIDER,
  type MarketDailyBar,
  type MarketHistoryProvider,
} from '../market-data.types.js';

import { mapRangeRowToDateRange } from './helpers/map-range-row-to-date-range.helper.js';
import { StockHistoryRepository } from './stock-history.repository.js';

/**
 * Days before today whose bars may still be restated (post-close uploads,
 * split/dividend adjustments). Those are always re-fetched on access.
 */
const FRESHNESS_DAYS = 7;

/**
 * The full retention window the client ever paginates back to (10 years,
 * matching the dashboard's "All" range).
 */
const RETENTION_DAYS = 3650;

/**
 * Cached access to end-of-day market history. Reads come from Postgres
 * first; only intervals the coverage ledger does not know about are fetched
 * from the configured provider and persisted. Because daily bars are
 * immutable once final, repeated questions about the same ticker cost no
 * provider calls, and clients paginating backwards only fill the gaps.
 */
@Injectable()
export class StockHistoryService {
  private readonly logger = new Logger(StockHistoryService.name);

  constructor(
    private readonly repository: StockHistoryRepository,
    @Inject(MARKET_HISTORY_PROVIDER)
    private readonly provider: MarketHistoryProvider,
  ) {}

  /**
   * Bars for the inclusive [from, to] window, ascending. Backfills missing
   * coverage and refreshes the recent window when the provider is available;
   * when not, whatever is cached is returned (possibly empty).
   */
  async getHistory(
    ticker: string,
    from: string,
    to: string,
  ): Promise<MarketDailyBar[]> {
    const target: DateRange = { from, to: to > utcToday() ? utcToday() : to };
    if (this.provider.isAvailable()) {
      await this.backfillMissingRanges(ticker, target);
      await this.refreshRecentWindow(ticker, target.to);
    }
    return this.repository.findBars(ticker, target.from, target.to);
  }

  /**
   * The ticker's available date range: the earliest and latest stored bar
   * dates after ensuring the full retention window is backfilled. Lets the
   * client size its range controls to the data that actually exists (a new
   * IPO has no 5Y button) instead of the lazily loaded window. Returns null
   * when the provider is unavailable and nothing is cached.
   */
  async getCoverage(
    ticker: string,
  ): Promise<{ from: string; to: string } | null> {
    const target: DateRange = {
      from: addDays(utcToday(), -RETENTION_DAYS),
      to: utcToday(),
    };
    if (this.provider.isAvailable()) {
      await this.backfillMissingRanges(ticker, target);
    }
    return this.repository.findCoverage(ticker);
  }

  /** Fetch and persist every target interval the ledger does not know. */
  private async backfillMissingRanges(
    ticker: string,
    target: DateRange,
  ): Promise<void> {
    const covered: DateRange[] = (await this.repository.findRanges(ticker)).map(
      mapRangeRowToDateRange,
    );

    const missing = computeMissingRanges(target, covered);
    if (missing.length === 0) return;

    for (const gap of missing) {
      const bars = await this.provider.fetchDailyBars(ticker, gap.from, gap.to);
      await this.repository.upsertBars(ticker, bars);
      this.logger.log(
        `Backfilled ${bars.length} bars for ${ticker} [${gap.from}..${gap.to}]`,
      );
    }

    await this.repository.replaceRanges(
      ticker,
      mergeDateRanges([...covered, ...missing]),
    );
  }

  /** Re-fetch the freshness window so late provider updates propagate. */
  private async refreshRecentWindow(ticker: string, to: string): Promise<void> {
    const freshFrom = addDays(utcToday(), -FRESHNESS_DAYS);
    // Windows entirely inside settled history are immutable — nothing to do.
    if (to < freshFrom) return;
    const bars = await this.provider.fetchDailyBars(ticker, freshFrom, to);
    if (bars.length === 0) return;
    await this.repository.upsertBars(ticker, bars);
  }
}
