import { z } from 'zod';

import { safeMediaUrlOrEmpty, safeVideoUrlOrEmpty } from '../helpers/url-trust/url-schema.helper.js';

import { galleryItemSchema } from './gallery-item-json.schema.js';
import { internationalCoverageSchema } from './international-coverage-json.schema.js';
import { sourceSchema } from './source-json.schema.js';
import { createTextItemSchema } from './text-item-json.schema.js';
import { HERO_VIDEO_TITLE_ISSUE, heroVideoHasTitle, videoGalleryItemSchema } from './video-gallery-item-json.schema.js';

const keyFindingSchema = createTextItemSchema('keyFindings');

export const summarySchema = z
  .object({
    category: z.string(),
    title: z.string().min(1, { message: 'title must not be empty' }),
    subtitle: z.string(),
    summary: z.string(),
    keyFindings: z.array(keyFindingSchema).optional(),
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
    internationalCoverage: internationalCoverageSchema.optional(),
  })
  .refine(heroVideoHasTitle, HERO_VIDEO_TITLE_ISSUE);
