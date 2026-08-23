import { z } from 'zod';

import type { TemplateSnippet } from './snippet.types.js';

/** Evaluation reasoning: the paragraph justifying score and verdict. */
export const reasoningSnippet: TemplateSnippet = {
  fields: {
    reasoning: z.string().optional(),
  },
  instruction: `SNIPPET reasoning (client paragraph under the verdict panel):
- reasoning: a short paragraph explaining the verdict and score. Include when the verdict needs justification; omit for self-evident verdicts.`,
};
