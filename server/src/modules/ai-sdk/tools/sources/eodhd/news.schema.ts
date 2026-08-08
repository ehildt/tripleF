import { z } from 'zod';

export const eodhdNewsSchema = z.object({
  ticker: z.string().describe('EODHD ticker code, e.g. NVDA.US'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .describe('Max news articles to return'),
});
