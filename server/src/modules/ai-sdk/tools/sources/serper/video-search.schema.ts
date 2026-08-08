import { z } from 'zod';

import { RECENCY_DESCRIPTION } from '../recency.constants.js';
import { STANDALONE_QUERY_DESCRIPTION } from '../standalone-query.constants.js';

export const serperVideoSearchSchema = z.object({
  query: z
    .string()
    .describe(
      `${STANDALONE_QUERY_DESCRIPTION} Add the video type (e.g. review, trailer, tutorial, gameplay). When the conversation language is not English, phrase the descriptive words in that language and append the language's own name (e.g. "Review Deutsch") to pull localized results.`,
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

export type SerperVideoSearchInput = z.infer<typeof serperVideoSearchSchema>;
