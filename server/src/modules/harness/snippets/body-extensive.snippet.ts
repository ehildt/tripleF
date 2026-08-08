import { z } from 'zod';

import type { TemplateSnippet } from './snippet.types.js';

/**
 * Article body — extensive flavor: the long-form core carrying context,
 * quotes, reactions, and background in full.
 */
export const bodyExtensiveSnippet: TemplateSnippet = {
  fields: {
    sectionTitle: z.string().optional(),
    sectionContent: z.string().optional(),
  },
  instruction: `SNIPPET body — EXTENSIVE (client body paragraphs):
- Needs: the full detail the retrieved results offer.
- sectionContent: the main body text as one plain-text string of 4-8 paragraphs: context, quotes, reactions, and background. This is the article's core — write it in full.
- sectionTitle: a heading for the main body section; omit only when the article needs none.`,
};
