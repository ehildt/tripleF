import { z } from 'zod';

import { galleryItemSchema } from '../../schemas/index.js';

import type { TemplateSnippet } from './snippet.types.js';

/** Image gallery: the remaining pool images as a band or mosaic grid. */
export const gallerySnippet: TemplateSnippet = {
  fields: {
    galleryTitle: z.string().optional(),
    galleryItems: z.array(galleryItemSchema).optional(),
  },
  instruction: `SNIPPET image gallery (client image band or mosaic grid):
- Needs: image URLs from the image pool beyond the hero image.
- galleryItems entries: { imageUrl, imageAlt, title, caption }; imageAlt and title MUST be non-empty.
- Include the remaining images up to imageTargetCount — aim for at least 3 when enough are available. Omit the keys entirely when no images remain — never invent URLs.
- galleryTitle: a heading for the gallery when included.`,
};
