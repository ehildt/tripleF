import type { z } from 'zod';

import { eodhdSearchApiResultSchema } from '../eodhd-api.types.js';

type EodhdSearchApiResult = z.infer<typeof eodhdSearchApiResultSchema>;

/** Normalize a PascalCase EODHD search result into the camelCase domain shape. */
export function mapEodhdSearchResult(r: EodhdSearchApiResult) {
  return {
    code: r.Code,
    name: r.Name,
    exchange: r.Exchange,
    type: r.Type,
    country: r.Country,
    currency: r.Currency,
    isin: r.ISIN,
    previousClose: r.previousClose,
    previousCloseDate: r.previousCloseDate,
    isPrimary: r.isPrimary,
  };
}
