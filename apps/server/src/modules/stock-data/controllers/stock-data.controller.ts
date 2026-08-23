import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { addDays, utcToday } from '../helpers/date-range.helper.js';
import {
  MarketHistoryFetchError,
  MarketHistoryUnavailableError,
  type StockHistoryPoint,
} from '../market-data.types.js';
import { StockHistoryService } from '../services/stock-history.service.js';

/** Default lookback when the client omits `from`: three calendar months. */
const DEFAULT_LOOKBACK_DAYS = 92;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

@ApiTags('Stock Data')
@Controller('stock-data')
export class StockDataController {
  constructor(private readonly stockHistory: StockHistoryService) {}

  @Get('coverage')
  @ApiOperation({
    summary: 'Available date range for a ticker (backfilled to retention)',
  })
  async getCoverage(
    @Query('ticker') ticker: string,
  ): Promise<{ ticker: string; from: string; to: string }> {
    if (!ticker?.trim()) {
      throw new BadRequestException('ticker is required');
    }
    const coverage = await this.stockHistory.getCoverage(ticker.trim());
    if (!coverage) throw new NotFoundException();
    return { ticker: ticker.trim(), ...coverage };
  }

  @Get('history')
  @ApiOperation({
    summary: 'Cached end-of-day OHLCV history for a ticker (gap backfilled)',
  })
  async getHistory(
    @Query('ticker') ticker: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<{ ticker: string; points: StockHistoryPoint[] }> {
    if (!ticker?.trim()) {
      throw new BadRequestException('ticker is required');
    }
    if ((from && !DATE_PATTERN.test(from)) || (to && !DATE_PATTERN.test(to))) {
      throw new BadRequestException('from/to must be YYYY-MM-DD');
    }
    const toDate = to ?? utcToday();
    const fromDate = from ?? addDays(toDate, -DEFAULT_LOOKBACK_DAYS);

    try {
      const bars = await this.stockHistory.getHistory(ticker, fromDate, toDate);
      if (bars.length === 0) throw new NotFoundException();
      return {
        ticker,
        points: bars.map((b) => ({
          time: b.date,
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
          volume: b.volume,
        })),
      };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      if (
        err instanceof MarketHistoryUnavailableError ||
        (err instanceof MarketHistoryFetchError && err.rateLimited)
      ) {
        throw new ServiceUnavailableException(
          err instanceof Error ? err.message : String(err),
        );
      }
      throw err;
    }
  }
}
