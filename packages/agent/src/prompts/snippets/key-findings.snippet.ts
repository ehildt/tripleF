import { z } from 'zod';

import { createTextItemSchema } from '../../schemas/index.js';

import type { TemplateSnippet } from './snippet.types.js';

/** Article key findings: short standalone observations (client findings cards). */
export const keyFindingsSnippet: TemplateSnippet = {
  fields: {
    keyFindings: z.array(createTextItemSchema('keyFindings')).optional(),
  },
  instruction: `SNIPPET key findings (client observation cards):
- Needs: observations distilled from the retrieved results.
- keyFindings: 0-5 short observations, each an object with exactly one key: "text".`,
};
