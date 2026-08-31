import type { StockMarketHistoryRange } from '../../../../generated/prisma/client.js';
import type { DateRange } from '../../helpers/date-range.helper.js';

/** Convert a coverage ledger row into a date range. */
export function mapRangeRowToDateRange(r: StockMarketHistoryRange): DateRange {
  return {
    from: r.fromDate.toISOString().slice(0, 10),
    to: r.toDate.toISOString().slice(0, 10),
  };
}
