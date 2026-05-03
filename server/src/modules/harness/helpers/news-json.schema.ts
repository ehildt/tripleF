import { z } from 'zod';

const keyPointSchema = z.object(
  {
    text: z.string().min(1, {
      message: 'keyPoints entries must have a non-empty text field',
    }),
  },
  { message: 'keyPoints entries must be objects with text' },
);

const newsSourceSchema = z.object(
  {
    url: z.string().url({ message: 'sources entries must have a valid url' }),
    title: z.string().min(1, { message: 'sources entries must have a title' }),
    sourceName: z.string().optional(),
    date: z.string().optional(),
    snippet: z.string().optional(),
  },
  { message: 'sources entries must be objects with url and title' },
);

const relatedStorySchema = z.object(
  {
    title: z
      .string()
      .min(1, { message: 'relatedStories entries must have a title' }),
    url: z
      .string()
      .url({ message: 'relatedStories entries must have a valid url' }),
    sourceName: z.string().optional(),
    date: z.string().optional(),
    imageUrl: z.string().url().optional().or(z.literal('')),
  },
  { message: 'relatedStories entries must have title and url' },
);

const videoGalleryItemSchema = z.object(
  {
    videoUrl: z
      .string()
      .url({ message: 'videoGalleryItems.videoUrl must be a valid URL' }),
    title: z.string().optional(),
    caption: z.string().optional(),
  },
  { message: 'videoGalleryItems entries must be objects with videoUrl' },
);

export const newsSchema = z.object({
  category: z.string(),
  headline: z.string().min(1, { message: 'headline must not be empty' }),
  deck: z.string(),
  lead: z.string(),
  sectionTitle: z.string(),
  sectionContent: z.string(),
  heroImageUrl: z.string().url().optional().or(z.literal('')),
  heroImageAlt: z.string().optional(),
  heroCaption: z.string().optional(),
  heroVideoUrl: z.string().url().optional().or(z.literal('')),
  heroVideoCaption: z.string().optional(),
  videoGalleryItems: z.array(videoGalleryItemSchema).optional(),
  keyPoints: z.array(keyPointSchema).optional(),
  sources: z.array(newsSourceSchema).optional(),
  relatedStories: z.array(relatedStorySchema).optional(),
  // Optional fields
  dateline: z.string().optional(),
  byline: z.string().optional(),
  publishDate: z.string().optional(),
  readTime: z.string().optional(),
});

export type NewsJson = z.infer<typeof newsSchema>;

export function formatZodIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}
