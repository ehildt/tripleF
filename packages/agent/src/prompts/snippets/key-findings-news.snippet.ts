import { z } from 'zod';

import { createTextItemSchema } from '../../schemas/response/text-item-json.schema.js';

import type { TemplateSnippet } from './snippet.types.js';

/** News key findings: scan-friendly takeaway bullets (client findings cards). */
export const newsKeyFindingsSnippet: TemplateSnippet = {
  fields: {
    keyFindings: z.array(createTextItemSchema('keyFindings')).optional(),
  },
  instruction: `SNIPPET news key findings (client takeaway bullet cards):
- Needs: facts distilled from the retrieved results.
- keyFindings: 3-5 short takeaways, each an object with exactly one key: "text".`,
};
