import { z } from 'zod';

import { safeUrl } from '../helpers/url-trust/url-schema.helper.js';

import { markerSchema, referenceLineSchema } from './chart-overlays-json.schema.js';
import { internationalCoverageSchema } from './international-coverage-json.schema.js';
import { sourceSchema } from './source-json.schema.js';
import { createTextItemSchema } from './text-item-json.schema.js';
import { videoGalleryItemSchema } from './video-gallery-item-json.schema.js';

const newsItemSchema = z.object(
  {
    title: z.string().min(1, {
      message: 'news entries must have a non-empty title',
    }),
    url: safeUrl({ message: 'news entries must have a valid url' }),
    source: z.string().optional(),
    date: z.string().optional(),
    snippet: z.string().optional(),
  },
  { message: 'news entries must be objects with title and url' },
);

const fundamentalsSchema = z.object({
  name: z.string().optional(),
  sector: z.string().optional(),
  industry: z.string().optional(),
  marketCap: z.union([z.number(), z.string()]).optional(),
  peRatio: z.union([z.number(), z.string()]).optional(),
  revenue: z.union([z.number(), z.string()]).optional(),
  profitMargin: z.union([z.number(), z.string()]).optional(),
});

export const stockmarketItemSchema = z.object({
  category: z.string(),
  title: z.string().min(1, { message: 'title must not be empty' }),
  subtitle: z.string(),
  shortDescription: z.string(),
  // Quote
  currentPrice: z.number().optional(),
  change: z.number().optional(),
  changeP: z.number().optional(),
  // Recommendation
  recommendation: z.string().optional(),
  recommendationReasoning: z.string().optional(),
  // Stats / context
  keyPoints: z.array(createTextItemSchema('keyPoints')).optional(),
  fundamentals: fundamentalsSchema.optional(),
  // News + attribution
  news: z.array(newsItemSchema).optional(),
  sources: z.array(sourceSchema).optional(),
  internationalCoverage: internationalCoverageSchema.optional(),
  // Chart overlays
  referenceLines: z.array(referenceLineSchema).optional(),
  markers: z.array(markerSchema).optional(),
  // Videos
  videoGalleryTitle: z.string().optional(),
  videoGalleryItems: z.array(videoGalleryItemSchema).optional(),
});
