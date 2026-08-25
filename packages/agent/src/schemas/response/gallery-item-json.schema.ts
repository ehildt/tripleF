import { z } from 'zod';

import { safeMediaUrl } from '../helpers/url-trust/url-schema.helper.js';

/**
 * One entry of a galleryItems array — shared by every snippet-composed
 * template with an image surface (news, article, evaluation).
 */
export const galleryItemSchema = z.object(
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
