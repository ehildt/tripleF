import { z } from 'zod';

import { createTextItemSchema } from '../schemas/text-item-json.schema.js';

import type { TemplateSnippet } from './snippet.types.js';

/** Evaluation assessment lists: strengths, weaknesses, recommendations. */
export const assessmentListsSnippet: TemplateSnippet = {
  fields: {
    strengths: z.array(createTextItemSchema('strengths')).optional(),
    weaknesses: z.array(createTextItemSchema('weaknesses')).optional(),
    recommendations: z
      .array(createTextItemSchema('recommendations'))
      .optional(),
  },
  instruction: `SNIPPET assessment lists (client labelled point lists):
- Needs: concrete observations from the conversation or retrieved results.
- strengths: 0-5 positive points; weaknesses: 0-5 critical points; recommendations: 0-5 actionable suggestions. Every entry is an object with exactly one key: "text".
- For multi-subject evaluations the per-subject strengths/weaknesses live inside subjects[] — emit the top-level strengths/weaknesses only for a single-subject critique. recommendations are always overall, never per subject.`,
};
