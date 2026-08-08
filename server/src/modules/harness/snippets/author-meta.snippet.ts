import { z } from 'zod';

import type { TemplateSnippet } from './snippet.types.js';

/**
 * Article metadata pills: author/publish date render in the exchange
 * header's meta bar, not in the template body. readTime stays
 * server-computed.
 */
export const authorMetaSnippet: TemplateSnippet = {
  fields: {
    author: z.string().optional(),
    publishDate: z.string().optional(),
    readTime: z.string().optional(),
  },
  instruction: `SNIPPET article metadata (client meta pills above the response):
- Needs: attribution from the retrieved sources.
- author: the author or publication name when the sources name one.
- publishDate: an ISO date string or human-readable date when known.
- readTime: leave empty — the server computes read time automatically.`,
};
