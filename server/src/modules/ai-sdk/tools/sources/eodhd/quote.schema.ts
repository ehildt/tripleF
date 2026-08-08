import { z } from 'zod';

export const eodhdQuoteSchema = z.object({
  tickers: z
    .array(z.string())
    .min(1)
    .max(20)
    .describe('EODHD ticker codes, e.g. ["NVDA.US", "AMD.US"]'),
});
