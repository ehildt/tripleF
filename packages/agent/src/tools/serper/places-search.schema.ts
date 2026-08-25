import { z } from 'zod';

export const serperPlacesSearchSchema = z.object({
  query: z
    .string()
    .describe(
      'A standalone places search query that explicitly names the business or business type plus location (e.g. "MediaMarkt Berlin", "coffee shops in Munich") — resolve the subject from the conversation; never copy the user message verbatim.',
    ),
  count: z.number().optional().describe('Number of results (max 100)'),
  lang: z.string().optional().describe('Two-letter ISO language code for result preference (e.g. en, de, ja)'),
});

export type SerperPlacesSearchInput = z.infer<typeof serperPlacesSearchSchema>;
