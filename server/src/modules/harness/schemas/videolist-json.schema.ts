import { z } from 'zod';

const videoGalleryItemSchema = z.object(
  {
    videoUrl: z
      .string()
      .min(1, { message: 'videoGalleryItems.videoUrl must not be empty' }),
    title: z.string().min(1, {
      message: 'videoGalleryItems.title must not be empty',
    }),
    caption: z.string().min(1, {
      message: 'videoGalleryItems.caption must not be empty',
    }),
    duration: z.string().optional(),
    channel: z.string().optional(),
    date: z.string().optional(),
    views: z.number().int().min(0).optional(),
    thumbnailUrl: z.string().url().optional().or(z.literal('')),
    description: z.string().optional(),
  },
  { message: 'videoGalleryItems entries must be objects with videoUrl' },
);

export const videolistSchema = z.object({
  category: z.string(),
  title: z.string().min(1, { message: 'title must not be empty' }),
  subtitle: z.string(),
  videoGalleryItems: z.array(videoGalleryItemSchema),
});

export type VideolistJson = z.infer<typeof videolistSchema>;

export function formatZodIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}
