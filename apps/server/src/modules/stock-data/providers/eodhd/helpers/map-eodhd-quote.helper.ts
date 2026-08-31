import type { z } from 'zod';

import { eodhdQuoteApiResultSchema } from '../eodhd-api.types.js';

type EodhdQuoteApiResult = z.infer<typeof eodhdQuoteApiResultSchema>;

/** Normalize a snake_case EODHD quote into the camelCase domain shape. */
export function mapEodhdQuote({ change_p, ...rest }: EodhdQuoteApiResult) {
  return { ...rest, changeP: change_p };
}
