import { z } from 'zod';

export const serperShoppingSearchSchema = z.object({
  query: z
    .string()
    .describe(
      'The exact product name with model number, kept short and standalone — resolve product references from the conversation (e.g. "the headphones we discussed" becomes "Sony WH-1000XM5"). No extra words like "buy", "price", or "review".',
    ),
  count: z.number().optional().describe('Number of results (max 100)'),
  lang: z
    .string()
    .optional()
    .describe(
      'Two-letter ISO language code for result preference (e.g. en, de, ja)',
    ),
});

export type SerperShoppingSearchInput = z.infer<
  typeof serperShoppingSearchSchema
>;
