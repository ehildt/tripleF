import { z } from 'zod';

import {
  safeMediaUrl,
  safeMediaUrlOrEmpty,
  safeUrl,
  safeVideoUrlOrEmpty,
} from '../helpers/url-schema.helper.js';

import {
  HERO_VIDEO_TITLE_ISSUE,
  heroVideoHasTitle,
  videoGalleryItemSchema,
} from './video-gallery-item-json.schema.js';

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
    url: safeUrl({ message: 'sources entries must have a valid url' }),
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
    url: safeUrl({ message: 'relatedStories entries must have a valid url' }),
    sourceName: z.string().optional(),
    imageUrl: safeMediaUrl({
      message: 'relatedStories entries must have a valid imageUrl',
    }),
    date: z.string().optional(),
  },
  { message: 'relatedStories entries must have title, url, and imageUrl' },
);

const galleryItemSchema = z.object(
  {
    imageUrl: safeMediaUrl({
      message: 'galleryItems.imageUrl must be a valid URL',
    }),
    imageAlt: z.string().min(1, {
      message: 'galleryItems.imageAlt must not be empty',
    }),
    title: z.string().min(1, {
      message: 'galleryItems.title must not be empty',
    }),
    caption: z.string().optional(),
  },
  { message: 'galleryItems entries must be objects with imageUrl' },
);

export const newsSchema = z
  .object({
    category: z.string(),
    headline: z.string().min(1, { message: 'headline must not be empty' }),
    deck: z.string(),
    lead: z.string(),
    sectionTitle: z.string(),
    sectionContent: z.string(),
    heroImageUrl: safeMediaUrlOrEmpty(),
    heroImageAlt: z.string().optional(),
    heroCaption: z.string().optional(),
    heroVideoUrl: safeVideoUrlOrEmpty(),
    heroVideoTitle: z.string().optional(),
    heroVideoCaption: z.string().optional(),
    galleryTitle: z.string().optional(),
    galleryItems: z.array(galleryItemSchema).optional(),
    videoGalleryTitle: z.string().optional(),
    videoGalleryItems: z.array(videoGalleryItemSchema).optional(),
    keyPoints: z.array(keyPointSchema).optional(),
    sources: z.array(newsSourceSchema).optional(),
    relatedStories: z.array(relatedStorySchema).optional(),
    // Optional fields
    dateline: z.string().optional(),
    byline: z.string().optional(),
    publishDate: z.string().optional(),
    readTime: z.string().optional(),
  })
  .refine(heroVideoHasTitle, HERO_VIDEO_TITLE_ISSUE);

export function formatZodIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}
