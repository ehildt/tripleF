import { z } from 'zod';

import { RECENCY_DESCRIPTION } from '../constants/recency.constants.js';
import { STANDALONE_QUERY_DESCRIPTION } from '../constants/standalone-query.constants.js';

export const serperImageSearchSchema = z.object({
  query: z.string().describe(`${STANDALONE_QUERY_DESCRIPTION} Add short visual qualifiers describing the subject.`),
  count: z.number().optional().describe('Number of results (max 100)'),
  minWidth: z
    .number()
    .optional()
    .describe(
      'Minimum image width in pixels. Use 1920 when the user wants 1080p-quality images, 2560 for 1440p, 3840 for 4K. The tool always enforces a floor of 1280 (720p).',
    ),
  minHeight: z
    .number()
    .optional()
    .describe(
      'Minimum image height in pixels. Use 1080 when the user wants 1080p-quality images, 1440 for 1440p, 2160 for 4K. The tool always enforces a floor of 720 (720p).',
    ),
  lang: z.string().optional().describe('Two-letter ISO language code for result preference (e.g. en, de, ja)'),
  recency: z.enum(['day', 'week', 'month', 'year']).optional().describe(RECENCY_DESCRIPTION),
});

export type SerperImageSearchInput = z.infer<typeof serperImageSearchSchema>;
