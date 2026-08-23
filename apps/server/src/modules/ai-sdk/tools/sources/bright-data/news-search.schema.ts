import { z } from 'zod';

import { RECENCY_DESCRIPTION } from '../recency.constants.js';
import { STANDALONE_QUERY_DESCRIPTION } from '../standalone-query.constants.js';

export const brightDataNewsSearchSchema = z.object({
  query: z
    .string()
    .describe(
      `${STANDALONE_QUERY_DESCRIPTION} Include the newsworthy angle (announcement, release, event, update).`,
    ),
  count: z.number().optional().describe('Number of results (max 100)'),
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

export type BrightDataNewsSearchInput = z.infer<
  typeof brightDataNewsSearchSchema
>;
