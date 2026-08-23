import { z } from 'zod';

export const eodhdIntradaySchema = z.object({
  ticker: z.string().describe('EODHD ticker code, e.g. NVDA.US'),
  interval: z
    .enum(['1m', '5m', '15m', '30m', '1h'])
    .optional()
    .describe('Intraday bar interval'),
  days: z
    .number()
    .int()
    .min(1)
    .max(60)
    .optional()
    .describe('Number of recent trading days to fetch for the volume profile'),
});
