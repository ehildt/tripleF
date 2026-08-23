import { z } from 'zod';

export const eodhdTechnicalSchema = z.object({
  ticker: z.string().describe('Ticker code, e.g. NVDA.US'),
  function: z
    .enum(['rsi', 'macd', 'adx', 'sma', 'ema', 'bbands', 'atr', 'stochastic'])
    .describe('Technical indicator function'),
  period: z
    .number()
    .int()
    .min(2)
    .max(200)
    .optional()
    .describe('Indicator period (e.g. 14 for RSI)'),
});
