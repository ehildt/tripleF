import { z } from 'zod';

import { safeUrl } from '../helpers/url-schema.helper.js';

import {
  HERO_VIDEO_TITLE_ISSUE,
  heroVideoHasTitle,
  videoGalleryItemSchema,
} from './video-gallery-item-json.schema.js';

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
    url: safeUrl({ message: 'sources entries must have a valid url' }),
    title: z.string().optional(),
  },
  { message: 'sources entries must be objects with url' },
);

const cardSchema = z.object(
  {
    url: safeUrl({ message: 'cards entries must have a valid url' }),
    title: z.string().optional(),
    description: z.string().optional(),
    linkLabel: z.string().optional(),
  },
  { message: 'cards entries must be objects with url' },
);

export const articleSchema = z
  .object({
    category: z.string(),
    title: z.string().min(1, { message: 'title must not be empty' }),
    subtitle: z.string(),
    summary: z.string(),
    sectionTitle: z.string(),
    sectionContent: z.string(),
    heroImageUrl: z.string().url().optional().or(z.literal('')),
    heroImageAlt: z.string().optional(),
    heroCaption: z.string().optional(),
    galleryTitle: z.string().optional(),
    galleryItems: z.array(galleryItemSchema).optional(),
    keyFindings: z.array(keyFindingSchema).optional(),
    sources: z.array(sourceSchema).optional(),
    conclusion: z.string().optional(),
    // Optional fields — validated only when present and non-empty
    author: z.string().optional(),
    publishDate: z.string().optional(),
    readTime: z.string().optional(),
    heroVideoUrl: z.string().url().optional().or(z.literal('')),
    heroVideoTitle: z.string().optional(),
    heroVideoCaption: z.string().optional(),
    videoGalleryTitle: z.string().optional(),
    videoGalleryItems: z.array(videoGalleryItemSchema).optional(),
    quote: z.string().optional(),
    cardsTitle: z.string().optional(),
    cards: z.array(cardSchema).optional(),
  })
  .refine(heroVideoHasTitle, HERO_VIDEO_TITLE_ISSUE);

export type ArticleJson = z.infer<typeof articleSchema>;

export function formatZodIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}
