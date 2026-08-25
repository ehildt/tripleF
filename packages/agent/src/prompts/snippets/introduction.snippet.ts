import { z } from 'zod';

import type { TemplateSnippet } from './snippet.types.js';

/** Evaluation introduction: the short framing paragraph under the hero. */
export const introductionSnippet: TemplateSnippet = {
  fields: {
    introduction: z.string().min(1, { message: 'introduction must not be empty' }).optional(),
  },
  instruction: `SNIPPET introduction (client framing paragraph under the hero):
- introduction: 1-3 sentences naming the evaluated subject(s) and what the evaluation covers. Always include it — a comparison without framing reads as a bare list.`,
};
