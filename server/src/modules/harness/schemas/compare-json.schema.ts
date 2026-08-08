import { z } from 'zod';

import { internationalCoverageSchema } from './international-coverage-json.schema.js';
import { referenceGalleryItemSchema } from './reference-gallery-item-json.schema.js';
import { sourceSchema } from './source-json.schema.js';
import { createTextItemSchema } from './text-item-json.schema.js';

const keyFindingSchema = createTextItemSchema('keyFindings');

export const compareSchema = z.object({
  category: z.string(),
  title: z.string().min(1, { message: 'title must not be empty' }),
  subtitle: z.string(),
  sectionContent: z.string(),
  galleryTitle: z.string().optional(),
  galleryItems: z.array(referenceGalleryItemSchema).optional(),
  keyFindings: z.array(keyFindingSchema).optional(),
  sources: z.array(sourceSchema).optional(),
  note: z.string().optional(),
  internationalCoverage: internationalCoverageSchema.optional(),
});
