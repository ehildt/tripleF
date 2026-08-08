import { z } from 'zod';

import { internationalCoverageSchema } from './international-coverage-json.schema.js';
import { videoGalleryItemSchema } from './video-gallery-item-json.schema.js';

export const videolistSchema = z.object({
  category: z.string(),
  title: z.string().min(1, { message: 'title must not be empty' }),
  subtitle: z.string(),
  videoGalleryItems: z.array(videoGalleryItemSchema),
  internationalCoverage: internationalCoverageSchema.optional(),
});
