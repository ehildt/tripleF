import { z } from 'zod';

import type { TemplateSnippet } from './snippet.types.js';

/**
 * News metadata pills: dateline/byline render in the exchange header's
 * meta bar, not in the template body. readTime stays server-computed.
 */
export const bylineDatelineSnippet: TemplateSnippet = {
  fields: {
    dateline: z.string().optional(),
    byline: z.string().optional(),
    publishDate: z.string().optional(),
    readTime: z.string().optional(),
  },
  instruction: `SNIPPET news metadata (client meta pills above the response):
- Needs: attribution from the retrieved articles.
- dateline: when and where the story is from (e.g. "2026-07-11, Gaza") when known.
- byline: the originating outlet or author when known (e.g. "Reuters" or "Jane Doe, BBC").
- publishDate: an ISO date string or human-readable date when known.
- readTime: leave empty — the server computes read time automatically.`,
};
