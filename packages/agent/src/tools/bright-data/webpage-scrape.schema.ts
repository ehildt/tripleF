import { z } from 'zod';

export const brightDataWebpageScrapeSchema = z.object({
  url: z.string().describe('The URL to fetch and render'),
});

export type BrightDataWebpageScrapeInput = z.infer<typeof brightDataWebpageScrapeSchema>;
