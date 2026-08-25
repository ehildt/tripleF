import { z } from 'zod';

import { discardedReferenceSchema } from './discarded-reference-json.schema.js';
import { internationalCoverageSchema } from './international-coverage-json.schema.js';
import { referenceGalleryItemSchema } from './reference-gallery-item-json.schema.js';
import { sourceSchema } from './source-json.schema.js';
import { createTextItemSchema } from './text-item-json.schema.js';
import { videoGalleryItemSchema } from './video-gallery-item-json.schema.js';

const keyFindingSchema = createTextItemSchema('keyFindings');

export const ocrSchema = z.object({
  category: z.string(),
  title: z.string().min(1, { message: 'title must not be empty' }),
  subtitle: z.string(),
  sectionContent: z.string(),
  keyFindings: z.array(keyFindingSchema).optional(),
  // Reference material, only when the model researched visible clues online
  galleryTitle: z.string().optional(),
  galleryItems: z.array(referenceGalleryItemSchema).optional(),
  videoGalleryTitle: z.string().optional(),
  videoGalleryItems: z.array(videoGalleryItemSchema).optional(),
  sources: z.array(sourceSchema).optional(),
  discardedReferences: z.array(discardedReferenceSchema).optional(),
  internationalCoverage: internationalCoverageSchema.optional(),
});
