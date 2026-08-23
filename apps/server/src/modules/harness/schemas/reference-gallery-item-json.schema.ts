import { z } from 'zod';

/**
 * Gallery item of the image-self-analysis templates (compare, describe,
 * ocr). Deliberately loose compared to the strict shared gallery item:
 * these galleries reference the user's own uploaded or locally stored
 * images, so imageUrl is any string (local path or URL) and the descriptive
 * fields stay optional.
 */
export const referenceGalleryItemSchema = z.object(
  {
    imageUrl: z.string(),
    imageAlt: z.string().optional(),
    title: z.string().optional(),
    caption: z.string().optional(),
  },
  { message: 'galleryItems entries must be objects with imageUrl' },
);
