import { z } from 'zod';

import { videoGalleryItemSchema } from './video-gallery-item-json.schema.js';

export const videolistSchema = z.object({
  category: z.string(),
  title: z.string().min(1, { message: 'title must not be empty' }),
  subtitle: z.string(),
  videoGalleryItems: z.array(videoGalleryItemSchema),
});

export function formatZodIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}
