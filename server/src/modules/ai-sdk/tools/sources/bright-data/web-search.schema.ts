import { z } from 'zod';

import { RECENCY_DESCRIPTION } from '../recency.constants.js';
import { STANDALONE_QUERY_DESCRIPTION } from '../standalone-query.constants.js';

export const brightDataWebSearchSchema = z.object({
  query: z.string().describe(STANDALONE_QUERY_DESCRIPTION),
  recency: z
    .enum(['day', 'week', 'month', 'year'])
    .optional()
    .describe(RECENCY_DESCRIPTION),
  lang: z
    .string()
    .optional()
    .describe(
      'Two-letter ISO language code for result preference (e.g. en, de, ja)',
    ),
});

export type BrightDataWebSearchInput = z.infer<
  typeof brightDataWebSearchSchema
>;
