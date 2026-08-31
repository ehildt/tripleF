import type { z } from 'zod';

import { eodhdHistoryApiPointSchema } from '../eodhd-api.types.js';

type EodhdHistoryApiPoint = z.infer<typeof eodhdHistoryApiPointSchema>;

/** Normalize a snake_case EODHD history point into the camelCase domain shape. */
export function mapEodhdHistoryPoint({
  adjusted_close,
  ...rest
}: EodhdHistoryApiPoint) {
  return {
    ...rest,
    adjustedClose: adjusted_close,
  };
}
