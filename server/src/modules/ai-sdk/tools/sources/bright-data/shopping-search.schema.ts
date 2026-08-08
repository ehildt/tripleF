import { z } from 'zod';

export const brightDataShoppingSearchSchema = z.object({
  query: z
    .string()
    .describe(
      'The exact product name with model number, kept short and standalone.',
    ),
  count: z.number().optional().describe('Number of results (max 100)'),
  lang: z
    .string()
    .optional()
    .describe(
      'Two-letter ISO language code for result preference (e.g. en, de, ja)',
    ),
});

export type BrightDataShoppingSearchInput = z.infer<
  typeof brightDataShoppingSearchSchema
>;
