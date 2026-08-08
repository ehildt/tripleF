import { z } from 'zod';

import { galleryItemSchema } from './gallery-item-json.schema.js';
import { internationalCoverageSchema } from './international-coverage-json.schema.js';
import { sourceSchema } from './source-json.schema.js';

/**
 * Imagelist gallery items: the shared strict gallery entry extended with the
 * image-search dimensions and origin the imagelist grid displays.
 */
const imagelistGalleryItemSchema = galleryItemSchema.extend({
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  source: z.string().optional(),
});

export const imagelistSchema = z.object({
  category: z.string(),
  title: z.string().min(1, { message: 'title must not be empty' }),
  subtitle: z.string(),
  galleryItems: z.array(imagelistGalleryItemSchema),
  sources: z.array(sourceSchema).optional(),
  internationalCoverage: internationalCoverageSchema.optional(),
});
