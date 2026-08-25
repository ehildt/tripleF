import { z } from 'zod';

import { safeMediaUrl, safeUrl } from '../helpers/url-trust/url-schema.helper.js';

/**
 * One relatedStories card. Image-backed by contract: the dashboard renders
 * cards as image tiles, so a story without a distinct image is dropped by
 * the prompt before it ever reaches this schema.
 */
export const relatedStorySchema = z.object(
  {
    title: z.string().min(1, { message: 'relatedStories entries must have a title' }),
    url: safeUrl({ message: 'relatedStories entries must have a valid url' }),
    sourceName: z.string().optional(),
    imageUrl: safeMediaUrl({
      message: 'relatedStories entries must have a valid imageUrl',
    }),
    date: z.string().optional(),
  },
  { message: 'relatedStories entries must have title, url, and imageUrl' },
);
