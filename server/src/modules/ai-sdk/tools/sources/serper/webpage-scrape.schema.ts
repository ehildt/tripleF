import { z } from 'zod';

export const serperWebpageScrapeSchema = z.object({
  url: z.string().describe('The URL to fetch and render'),
});

export type SerperWebpageScrapeInput = z.infer<
  typeof serperWebpageScrapeSchema
>;
