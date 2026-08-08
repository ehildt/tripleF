import { z } from 'zod';

import type { TemplateSnippet } from './snippet.types.js';

/** Article summary: the 1–2 sentence answer paragraph (client lead section). */
export const summarySnippet: TemplateSnippet = {
  fields: {
    summary: z.string().min(1, { message: 'summary must not be empty' }),
  },
  instruction: `SNIPPET summary (client lead paragraph):
- Needs: the core answer from the retrieved results.
- summary: a 1-2 sentence lead paragraph that answers the core question. REQUIRED, non-empty.`,
};
