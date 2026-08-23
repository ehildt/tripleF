import { z } from 'zod';

export const eodhdSearchSchema = z.object({
  query: z
    .string()
    .describe('Company, ETF, or index name to resolve to a ticker'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .describe('Max candidate tickers to return'),
});
