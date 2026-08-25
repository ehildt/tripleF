import { z } from 'zod';

import { videoGalleryItemSchema } from '../../schemas/index.js';

import type { TemplateSnippet } from './snippet.types.js';

/** Video gallery: additional videos as an embedded grid (client playlist). */
export const videoGallerySnippet: TemplateSnippet = {
  fields: {
    videoGalleryTitle: z.string().optional(),
    videoGalleryItems: z.array(videoGalleryItemSchema).optional(),
  },
  instruction: `SNIPPET video gallery (client video grid):
- Needs: video URLs from videoSearch results ONLY (never the hero video, never channel/playlist/profile URLs; supported providers or direct video files).
- videoGalleryItems entries: { videoUrl, title, caption }; title and caption MUST be non-empty. Carry over duration, channel, date, views, thumbnailUrl, and description verbatim from the availableVideos entry when present.
- Include the additional videos up to videoTargetCount when the pool holds more than one; otherwise omit the keys entirely.
- videoGalleryTitle: a heading for the gallery when included.`,
};
