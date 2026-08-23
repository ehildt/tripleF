import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../generated/prisma/client.js';
import type { PostgresConfig } from '../../dead-letter/configs/postgres-config.adapter.js';
import { POSTGRES_CONFIG } from '../../dead-letter/constants/postgres.constants.js';
import type { MarketDailyBar } from '../market-data.types.js';

/**
 * Persists the cached end-of-day bars and the coverage ledger for them.
 * Rows past the freshness window are immutable; the service decides when a
 * day may be re-fetched and rewritten.
 */
@Injectable()
export class StockHistoryRepository implements OnModuleInit, OnModuleDestroy {
  private _prisma: PrismaClient | null = null;

  constructor(
    @Inject(POSTGRES_CONFIG)
    private readonly _config: PostgresConfig,
  ) {}

  get prisma() {
    return this._prisma as PrismaClient;
  }

  async onModuleInit() {
    const adapter = new PrismaPg({
      connectionString: this._config.url,
    });
    this._prisma = new PrismaClient({ adapter });
  }

  async onModuleDestroy() {
    await this._prisma?.$disconnect();
    this._prisma = null;
  }

  /** Fetched coverage windows for a ticker, ascending. */
  async findRanges(ticker: string) {
    return this.prisma.stockMarketHistoryRange.findMany({
      where: { ticker },
      orderBy: { fromDate: 'asc' },
    });
  }

  /** Replace the coverage ledger for a ticker with the merged intervals. */
  async replaceRanges(
    ticker: string,
    ranges: Array<{ from: string; to: string }>,
  ) {
    await this.prisma.$transaction([
      this.prisma.stockMarketHistoryRange.deleteMany({ where: { ticker } }),
      this.prisma.stockMarketHistoryRange.createMany({
        data: ranges.map((r) => ({
          ticker,
          fromDate: new Date(`${r.from}T00:00:00Z`),
          toDate: new Date(`${r.to}T00:00:00Z`),
        })),
      }),
    ]);
  }

  /** All stored bars inside the inclusive window, ascending by date. */
  async findBars(
    ticker: string,
    from: string,
    to: string,
  ): Promise<MarketDailyBar[]> {
    const rows = await this.prisma.stockMarketBar.findMany({
      where: {
        ticker,
        date: {
          gte: new Date(`${from}T00:00:00Z`),
          lte: new Date(`${to}T00:00:00Z`),
        },
      },
      orderBy: { date: 'asc' },
    });
    return rows.map((row) => ({
      date: row.date.toISOString().slice(0, 10),
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      adjustedClose: row.adjustedClose ?? undefined,
      volume: Number(row.volume),
    }));
  }

  /**
   * The earliest and latest stored bar dates for a ticker, or null when
   * nothing is cached. Two indexed lookups — cheap enough for a coverage
   * probe on every chart mount.
   */
  async findCoverage(
    ticker: string,
  ): Promise<{ from: string; to: string } | null> {
    const [first, last] = await Promise.all([
      this.prisma.stockMarketBar.findFirst({
        where: { ticker },
        orderBy: { date: 'asc' },
        select: { date: true },
      }),
      this.prisma.stockMarketBar.findFirst({
        where: { ticker },
        orderBy: { date: 'desc' },
        select: { date: true },
      }),
    ]);
    if (!first || !last) return null;
    return {
      from: first.date.toISOString().slice(0, 10),
      to: last.date.toISOString().slice(0, 10),
    };
  }

  /** Insert or overwrite bars, chunked so large backfills stay transactional. */
  async upsertBars(ticker: string, bars: MarketDailyBar[]): Promise<void> {
    const CHUNK = 500;
    for (let i = 0; i < bars.length; i += CHUNK) {
      const chunk = bars.slice(i, i + CHUNK);
      await this.prisma.$transaction(
        chunk.map((bar) =>
          this.prisma.stockMarketBar.upsert({
            where: {
              ticker_date: { ticker, date: new Date(`${bar.date}T00:00:00Z`) },
            },
            create: {
              ticker,
              date: new Date(`${bar.date}T00:00:00Z`),
              open: bar.open,
              high: bar.high,
              low: bar.low,
              close: bar.close,
              adjustedClose: bar.adjustedClose ?? null,
              volume: BigInt(Math.trunc(bar.volume)),
            },
            update: {
              open: bar.open,
              high: bar.high,
              low: bar.low,
              close: bar.close,
              adjustedClose: bar.adjustedClose ?? null,
              volume: BigInt(Math.trunc(bar.volume)),
              fetchedAt: new Date(),
            },
          }),
        ),
      );
    }
  }
}
