import { z } from 'zod';

import type { TemplateSnippet } from './snippet.types.js';

/** Article pull quote — the aside that unlocks the editorial layout. */
export const quoteSnippet: TemplateSnippet = {
  fields: {
    quote: z.string().optional(),
  },
  instruction: `SNIPPET pull quote (client quote aside; the editorial layout needs it):
- Needs: a quote that exists verbatim in the retrieved results.
- quote: one notable quote from the sources; omit when none exists.`,
};
