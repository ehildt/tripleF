import { z } from 'zod';

import type { TemplateSnippet } from './snippet.types.js';

/** Article conclusion: the closing summary block (client conclusion section). */
export const conclusionSnippet: TemplateSnippet = {
  fields: {
    conclusion: z.string().optional(),
  },
  instruction: `SNIPPET conclusion (client closing section):
- conclusion: a brief closing summary (1-3 sentences); omit when the article already lands cleanly.`,
};
