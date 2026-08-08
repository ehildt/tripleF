import { z } from 'zod';

export const eodhdFundamentalsSchema = z.object({
  ticker: z.string().describe('EODHD ticker code, e.g. NVDA.US'),
});
