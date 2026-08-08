import { z } from 'zod';

import type { TemplateSnippet } from './snippet.types.js';

/** News masthead: category chip, headline, optional deck (client HeroSection). */
export const headerNewsSnippet: TemplateSnippet = {
  fields: {
    category: z.string().optional(),
    headline: z.string().min(1, { message: 'headline must not be empty' }),
    deck: z.string().optional(),
  },
  instruction: `SNIPPET news header (client hero headline block):
- category: a short label such as News, Tech, Gaming, World, Business.
- headline: a concise, factual headline stating the key fact. REQUIRED, non-empty.
- deck: an optional one-line sub-headline adding context; omit when it adds nothing.`,
};
