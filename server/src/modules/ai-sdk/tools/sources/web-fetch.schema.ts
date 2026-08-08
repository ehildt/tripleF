import { z } from 'zod';

export const webFetchSchema = z.object({
  url: z.string().describe('The URL to fetch content from'),
});

export type WebFetchInput = z.infer<typeof webFetchSchema>;
