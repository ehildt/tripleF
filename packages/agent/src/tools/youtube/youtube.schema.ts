import { z } from 'zod';

import { STANDALONE_QUERY_DESCRIPTION } from '../constants/standalone-query.constants.js';

export const youtubeVideoSearchSchema = z.object({
  query: z
    .string()
    .describe(`${STANDALONE_QUERY_DESCRIPTION} Add the video type (e.g. review, trailer, tutorial, gameplay).`),
  count: z.number().optional().describe('Number of results (max 50)'),
  recency: z
    .enum(['day', 'week', 'month', 'year'])
    .optional()
    .describe(
      'Restrict results to the given past period (day=24 hours, week=7 days, month=1 month, year=1 year). Use for fresh content such as news, recent releases, or trending topics; leave unset for evergreen, historical, or general queries.',
    ),
  lang: z.string().optional().describe('Two-letter ISO language code for result preference (e.g. en, de, ja)'),
});

export type YoutubeVideoSearchInput = z.infer<typeof youtubeVideoSearchSchema>;
