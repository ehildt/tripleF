import { z } from 'zod';

import { RECENCY_DESCRIPTION } from '../recency.constants.js';
import { STANDALONE_QUERY_DESCRIPTION } from '../standalone-query.constants.js';

export const brightDataImageSearchSchema = z.object({
  query: z
    .string()
    .describe(
      `${STANDALONE_QUERY_DESCRIPTION} Add short visual qualifiers describing the subject.`,
    ),
  count: z.number().optional().describe('Number of results (max 100)'),
  minWidth: z
    .number()
    .optional()
    .describe('Minimum image width in pixels (floor 1280 / 720p).'),
  minHeight: z
    .number()
    .optional()
    .describe('Minimum image height in pixels (floor 720 / 720p).'),
  lang: z
    .string()
    .optional()
    .describe(
      'Two-letter ISO language code for result preference (e.g. en, de, ja)',
    ),
  recency: z
    .enum(['day', 'week', 'month', 'year'])
    .optional()
    .describe(RECENCY_DESCRIPTION),
});

export type BrightDataImageSearchInput = z.infer<
  typeof brightDataImageSearchSchema
>;
