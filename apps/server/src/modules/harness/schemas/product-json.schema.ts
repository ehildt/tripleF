import { z } from 'zod';

import {
  safeMediaUrlOrEmpty,
  safeUrl,
} from '../helpers/url-trust/url-schema.helper.js';

import { galleryItemSchema } from './gallery-item-json.schema.js';
import { internationalCoverageSchema } from './international-coverage-json.schema.js';
import { sourceSchema } from './source-json.schema.js';
import { createTextItemSchema } from './text-item-json.schema.js';
import { videoGalleryItemSchema } from './video-gallery-item-json.schema.js';

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

export const productSchema = z.object({
  category: z.string(),
  title: z.string().min(1, { message: 'title must not be empty' }),
  subtitle: z.string(),
  shortDescription: z.string(),
  // Purchase-decision fields
  aggregateRating: z.number().min(0).max(5).optional(),
  aggregateRatingCount: z.number().int().min(0).optional(),
  aggregateRatingLabel: z.string().optional(),
  statHighlights: z.array(statHighlightSchema).optional(),
  keyPoints: z.array(createTextItemSchema('keyPoints')).optional(),
  pros: z.array(createTextItemSchema('pros')).optional(),
  cons: z.array(createTextItemSchema('cons')).optional(),
  shopOffers: z.array(shopOfferSchema).optional(),
  // Media — the product banner is image-only, there is no hero video
  heroImageUrl: safeMediaUrlOrEmpty(),
  heroImageAlt: z.string().optional(),
  heroCaption: z.string().optional(),
  galleryTitle: z.string().optional(),
  galleryItems: z.array(galleryItemSchema).optional(),
  videoGalleryTitle: z.string().optional(),
  videoGalleryItems: z.array(videoGalleryItemSchema).optional(),
  // Attribution
  sources: z.array(sourceSchema).optional(),
  internationalCoverage: internationalCoverageSchema.optional(),
});
