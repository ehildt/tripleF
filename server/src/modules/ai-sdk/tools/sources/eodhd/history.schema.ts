import { z } from 'zod';

export const eodhdHistorySchema = z.object({
  ticker: z.string().describe('EODHD ticker code, e.g. NVDA.US'),
  period: z
    .enum(['d', 'w', 'm'])
    .optional()
    .describe('Bar period: d (daily), w (weekly), m (monthly)'),
  points: z
    .number()
    .int()
    .min(10)
    .max(1000)
    .optional()
    .describe('Approximate number of history points to fetch'),
});
