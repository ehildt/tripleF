import { z } from 'zod';

import { relatedStorySchema } from '../../schemas/response/related-story-json.schema.js';

import type { TemplateSnippet } from './snippet.types.js';

/**
 * Related stories: image-backed teaser cards (client story-card row).
 * Cards are image-tiles client-side, so a story without a distinct
 * image-pool thumbnail gets dropped instead of rendering empty.
 */
export const relatedStoriesSnippet: TemplateSnippet = {
  fields: {
    relatedStories: z.array(relatedStorySchema).optional(),
  },
  instruction: `SNIPPET related stories (client story-card row):
- Needs: extra distinct article URLs from news/web results, each with its own image-pool thumbnail.
- relatedStories: up to 6 cards, each with title, url, and imageUrl non-empty, plus sourceName and date when available. imageUrl comes from remaining imageSearch pool images only — never from news thumbnails.
- Write fresh teaser titles that do not restate the headline, deck, or lead.`,
};
