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

const textEntrySchema = (field: string) =>
  z.object(
    {
      text: z.string().min(1, {
        message: `${field} entries must have a non-empty text field`,
      }),
    },
    { message: `${field} entries must be objects with text` },
  );

const shopOfferSchema = z.object(
  {
    title: z.string().optional(),
    price: z.string().optional(),
    source: z.string().optional(),
    link: safeUrl({ message: 'shopOffers entries must have a valid link' }),
    imageUrl: z.string().url().optional().or(z.literal('')),
    delivery: z.string().optional(),
    rating: z.number().optional(),
    ratingCount: z.number().optional(),
  },
  { message: 'shopOffers entries must be objects with a link' },
);

const statHighlightSchema = z.object(
  {
    label: z
      .string()
      .min(1, { message: 'statHighlights entries must have a label' }),
    value: z
      .string()
      .min(1, { message: 'statHighlights entries must have a value' }),
  },
  { message: 'statHighlights entries must be objects with label and value' },
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

export const productSchema = z
  .object({
    category: z.string(),
    title: z.string().min(1, { message: 'title must not be empty' }),
    subtitle: z.string(),
    shortDescription: z.string(),
    // Purchase-decision fields
    priceRange: z.string().optional(),
    aggregateRating: z.number().min(0).max(5).optional(),
    aggregateRatingCount: z.number().int().min(0).optional(),
    aggregateRatingLabel: z.string().optional(),
    buyAdvice: z.string().optional(),
    statHighlights: z.array(statHighlightSchema).optional(),
    keyPoints: z.array(textEntrySchema('keyPoints')).optional(),
    pros: z.array(textEntrySchema('pros')).optional(),
    cons: z.array(textEntrySchema('cons')).optional(),
    shopOffers: z.array(shopOfferSchema).optional(),
    reviewSummary: z.array(textEntrySchema('reviewSummary')).optional(),
    // Optional deep-dive
    sectionTitle: z.string().optional(),
    sectionContent: z.string().optional(),
    // Media
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
    // Attribution
    sources: z.array(sourceSchema).optional(),
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
