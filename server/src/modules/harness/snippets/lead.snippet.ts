import { z } from 'zod';

import type { TemplateSnippet } from './snippet.types.js';

/** News lead: the inverted-pyramid opening paragraph (client lead section). */
export const leadSnippet: TemplateSnippet = {
  fields: {
    lead: z.string().min(1, { message: 'lead must not be empty' }),
  },
  instruction: `SNIPPET lead (client lead paragraph):
- Needs: the core facts from the retrieved results.
- lead: 2-4 sentences answering who, what, when, where, why and how, strongest facts first (inverted pyramid). REQUIRED, non-empty.`,
};
