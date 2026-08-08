import { z } from 'zod';

import {
  markerSchema,
  referenceLineSchema,
} from './chart-overlays-json.schema.js';
import { internationalCoverageSchema } from './international-coverage-json.schema.js';
import { sourceSchema } from './source-json.schema.js';
import { videoGalleryItemSchema } from './video-gallery-item-json.schema.js';

const listItemSchema = z.object(
  {
    name: z.string().min(1, {
      message: 'items entries must have a non-empty name',
    }),
    ticker: z.string().min(1, {
      message: 'items entries must have a non-empty ticker',
    }),
    price: z.number().optional(),
    change: z.number().optional(),
    changeP: z.number().optional(),
  },
  { message: 'items entries must be objects with name and ticker' },
);

export const stockmarketListSchema = z.object({
  category: z.string(),
  title: z.string().min(1, { message: 'title must not be empty' }),
  subtitle: z.string(),
  summary: z.string(),
  items: z.array(listItemSchema).optional(),
  sources: z.array(sourceSchema).optional(),
  internationalCoverage: internationalCoverageSchema.optional(),
  // Chart overlays
  referenceLines: z.array(referenceLineSchema).optional(),
  markers: z.array(markerSchema).optional(),
  // Videos
  videoGalleryTitle: z.string().optional(),
  videoGalleryItems: z.array(videoGalleryItemSchema).optional(),
});
