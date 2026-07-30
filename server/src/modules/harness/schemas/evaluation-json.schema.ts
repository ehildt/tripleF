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

const textItemSchema = z.object(
  {
    text: z.string().min(1, {
      message: 'text entries must have a non-empty text field',
    }),
  },
  { message: 'text entries must be objects with text' },
);

const sourceSchema = z.object(
  {
    url: safeUrl({ message: 'sources entries must have a valid url' }),
    title: z.string().optional(),
    sourceName: z.string().optional(),
    date: z.string().optional(),
    snippet: z.string().optional(),
  },
  { message: 'sources entries must be objects with url' },
);

export const evaluationSchema = z
  .object({
    category: z.string(),
    title: z.string().min(1, { message: 'title must not be empty' }),
    subtitle: z.string(),
    subject: z.string().min(1, { message: 'subject must not be empty' }),
    verdict: z.string().min(1, { message: 'verdict must not be empty' }),
    score: z.number(),
    scoreLabel: z.string().min(1, { message: 'scoreLabel must not be empty' }),
    reasoning: z.string().optional(),
    strengths: z.array(textItemSchema).optional(),
    weaknesses: z.array(textItemSchema).optional(),
    recommendations: z.array(textItemSchema).optional(),
    sources: z.array(sourceSchema).optional(),
    // Media from online research
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
