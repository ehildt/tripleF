import { z } from 'zod';

import type { TemplateSnippet } from './snippet.types.js';

/**
 * News body — brief flavor: the brief stays compact, so the body only adds
 * what the lead and key points cannot carry.
 */
export const bodyBriefSnippet: TemplateSnippet = {
  fields: {
    sectionTitle: z.string().optional(),
    sectionContent: z.string().optional(),
  },
  instruction: `SNIPPET body — BRIEF (client body paragraphs):
- Needs: background detail the retrieved results already report.
- sectionContent: at most 1-2 short paragraphs of essential context. The brief stays compact: the lead and key points already carry the story. Omit entirely when they cover it.
- sectionTitle: a heading for the body; omit when the brief flows without one.`,
};
