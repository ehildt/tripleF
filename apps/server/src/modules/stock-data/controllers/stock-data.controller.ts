import {
  Controller,
  Get,
  NotFoundException,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { StockCoverageQueryDto } from '../dtos/stock-coverage-query.dto.js';
import { StockHistoryQueryDto } from '../dtos/stock-history-query.dto.js';
import { addDays, utcToday } from '../helpers/date-range.helper.js';
import { mapDailyBarToPoint } from '../helpers/map-daily-bar-to-point.helper.js';
import {
  MarketHistoryFetchError,
  MarketHistoryUnavailableError,
  type StockHistoryPoint,
} from '../market-data.types.js';
import { StockHistoryService } from '../services/stock-history.service.js';

/** Default lookback when the client omits `from`: three calendar months. */
const DEFAULT_LOOKBACK_DAYS = 92;

@ApiTags('Stock Data')
@Controller('stock-data')
export class StockDataController {
  constructor(private readonly stockHistory: StockHistoryService) {}

  @Get('coverage')
  @ApiOperation({
    summary: 'Available date range for a ticker (backfilled to retention)',
  })
  async getCoverage(
    @Query() query: StockCoverageQueryDto,
  ): Promise<{ ticker: string; from: string; to: string }> {
    const coverage = await this.stockHistory.getCoverage(query.ticker);
    if (!coverage) throw new NotFoundException();
    return { ticker: query.ticker, ...coverage };
  }

  @Get('history')
  @ApiOperation({
    summary: 'Cached end-of-day OHLCV history for a ticker (gap backfilled)',
  })
  async getHistory(
    @Query() query: StockHistoryQueryDto,
  ): Promise<{ ticker: string; points: StockHistoryPoint[] }> {
    const toDate = query.to ?? utcToday();
    const fromDate = query.from ?? addDays(toDate, -DEFAULT_LOOKBACK_DAYS);

    try {
      const bars = await this.stockHistory.getHistory(
        query.ticker,
        fromDate,
        toDate,
      );
      if (bars.length === 0) throw new NotFoundException();
      return {
        ticker: query.ticker,
        points: bars.map(mapDailyBarToPoint),
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
