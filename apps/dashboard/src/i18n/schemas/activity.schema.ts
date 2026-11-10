import { z } from 'zod';

/** Live pipeline and tool activity, localized without changing the UI locale. */
export const activitySchema = z.object({
  understanding: z.string(),
  choosingAction: z.string(),
  reviewingResults: z.string(),
  verifying: z.string(),
  assembling: z.string(),
  responding: z.string(),
  analyzingImages: z.string(),
  gatheringImages: z.string(),
  refining: z.string(),
  memoryRecall: z.string(),
  memoryDelete: z.string(),
  knowledgeSearch: z.string(),
  knowledgeRead: z.string(),
  web: z.string(),
  images: z.string(),
  videos: z.string(),
  news: z.string(),
  shopping: z.string(),
  reviews: z.string(),
  places: z.string(),
  fetch: z.string(),
  reference: z.string(),
  variants: z.string(),
  executingTool: z.string(),
  market: z.string().optional(),
  forQuery: z.string(),
  sourcesCount: z.string(),
});

export type ActivityMessages = z.infer<typeof activitySchema>;
