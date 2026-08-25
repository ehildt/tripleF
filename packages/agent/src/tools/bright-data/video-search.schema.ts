import { z } from 'zod';

import { RECENCY_DESCRIPTION } from '../constants/recency.constants.js';
import { STANDALONE_QUERY_DESCRIPTION } from '../constants/standalone-query.constants.js';

export const brightDataVideoSearchSchema = z.object({
  query: z
    .string()
    .describe(`${STANDALONE_QUERY_DESCRIPTION} Add the video type (e.g. review, trailer, tutorial, gameplay).`),
  count: z.number().optional().describe('Number of results (max 100)'),
  recency: z.enum(['day', 'week', 'month', 'year']).optional().describe(RECENCY_DESCRIPTION),
  lang: z.string().optional().describe('Two-letter ISO language code for result preference (e.g. en, de, ja)'),
});

export type BrightDataVideoSearchInput = z.infer<typeof brightDataVideoSearchSchema>;
