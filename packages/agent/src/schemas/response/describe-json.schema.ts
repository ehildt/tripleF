import { z } from 'zod';

import { discardedReferenceSchema } from './discarded-reference-json.schema.js';
import { internationalCoverageSchema } from './international-coverage-json.schema.js';
import { referenceGalleryItemSchema } from './reference-gallery-item-json.schema.js';
import { sourceSchema } from './source-json.schema.js';
import { createTextItemSchema } from './text-item-json.schema.js';
import { videoGalleryItemSchema } from './video-gallery-item-json.schema.js';

const keyFindingSchema = createTextItemSchema('keyFindings');

export const describeSchema = z.object({
  category: z.string(),
  title: z.string().min(1, { message: 'title must not be empty' }),
  subtitle: z.string(),
  sectionContent: z.string(),
  galleryTitle: z.string().optional(),
  galleryItems: z.array(referenceGalleryItemSchema).optional(),
  videoGalleryTitle: z.string().optional(),
  videoGalleryItems: z.array(videoGalleryItemSchema).optional(),
  keyFindings: z.array(keyFindingSchema).optional(),
  sources: z.array(sourceSchema).optional(),
  discardedReferences: z.array(discardedReferenceSchema).optional(),
  note: z.string().optional(),
  internationalCoverage: internationalCoverageSchema.optional(),
});
