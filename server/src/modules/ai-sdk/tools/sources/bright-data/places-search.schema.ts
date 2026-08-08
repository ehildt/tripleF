import { z } from 'zod';

export const brightDataPlacesSearchSchema = z.object({
  query: z
    .string()
    .describe(
      'A standalone places search query that explicitly names the business or business type plus location (e.g. "MediaMarkt Berlin", "coffee shops in Munich").',
    ),
  count: z.number().optional().describe('Number of results (max 100)'),
  lang: z
    .string()
    .optional()
    .describe(
      'Two-letter ISO language code for result preference (e.g. en, de, ja)',
    ),
});

export type BrightDataPlacesSearchInput = z.infer<
  typeof brightDataPlacesSearchSchema
>;
