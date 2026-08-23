import { z } from 'zod';

export const serperBusinessReviewsSearchSchema = z.object({
  query: z
    .string()
    .optional()
    .describe(
      'The exact business or place name, ideally with its location, named explicitly and resolved from the conversation. Used when neither placeId nor cid is known.',
    ),
  placeId: z
    .string()
    .optional()
    .describe(
      'Google Place ID of the business. Most precise identifier — prefer it when available.',
    ),
  cid: z
    .string()
    .optional()
    .describe('Google CID of the business, e.g. from a places search result.'),
  lang: z
    .string()
    .optional()
    .describe(
      'Two-letter ISO language code for result preference (e.g. en, de, ja)',
    ),
});

export type SerperBusinessReviewsSearchInput = z.infer<
  typeof serperBusinessReviewsSearchSchema
>;
