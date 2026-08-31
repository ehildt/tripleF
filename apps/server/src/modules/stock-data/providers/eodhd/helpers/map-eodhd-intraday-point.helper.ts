import type { z } from 'zod';

import { eodhdIntradayApiPointSchema } from '../eodhd-api.types.js';

type EodhdIntradayApiPoint = z.infer<typeof eodhdIntradayApiPointSchema>;

/** Normalize an EODHD intraday point into the camelCase domain shape. */
export function mapEodhdIntradayPoint(p: EodhdIntradayApiPoint) {
  return {
    time: p.datetime,
    open: p.open,
    high: p.high,
    low: p.low,
    close: p.close,
    volume: p.volume,
  };
}
