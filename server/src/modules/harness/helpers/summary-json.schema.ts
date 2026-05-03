import { z } from 'zod';

const galleryItemSchema = z.object(
  {
    imageUrl: z
      .string()
      .url({ message: 'galleryItems.imageUrl must be a valid URL' }),
    imageAlt: z.string().optional(),
    title: z.string().optional(),
    caption: z.string().optional(),
  },
  { message: 'galleryItems entries must be objects with imageUrl' },
);

const videoGalleryItemSchema = z.object(
  {
    videoUrl: z
      .string()
      .min(1, { message: 'videoGalleryItems.videoUrl must not be empty' }),
    title: z.string().optional(),
    caption: z.string().optional(),
  },
  { message: 'videoGalleryItems entries must be objects with videoUrl' },
);

const keyFindingSchema = z.object(
  {
    text: z.string().min(1, {
      message: 'keyFindings entries must have a non-empty text field',
    }),
  },
  { message: 'keyFindings entries must be objects with text' },
);

const sourceSchema = z.object(
  {
    url: z.string().url({ message: 'sources entries must have a valid url' }),
    title: z.string().optional(),
    sourceName: z.string().optional(),
    date: z.string().optional(),
    snippet: z.string().optional(),
  },
  { message: 'sources entries must be objects with url' },
);

export const summarySchema = z.object({
  category: z.string(),
  title: z.string().min(1, { message: 'title must not be empty' }),
  subtitle: z.string(),
  summary: z.string(),
  keyFindings: z.array(keyFindingSchema).optional(),
  sources: z.array(sourceSchema).optional(),
  // Media from online research
  heroImageUrl: z.string().url().optional().or(z.literal('')),
  heroImageAlt: z.string().optional(),
  heroCaption: z.string().optional(),
  heroVideoUrl: z.string().min(1).optional().or(z.literal('')),
  heroVideoCaption: z.string().optional(),
  galleryTitle: z.string().optional(),
  galleryItems: z.array(galleryItemSchema).optional(),
  videoGalleryTitle: z.string().optional(),
  videoGalleryItems: z.array(videoGalleryItemSchema).optional(),
});

export type SummaryJson = z.infer<typeof summarySchema>;

export function formatZodIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}
