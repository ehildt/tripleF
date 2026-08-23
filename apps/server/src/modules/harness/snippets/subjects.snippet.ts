import { z } from 'zod';

import { createTextItemSchema } from '../schemas/text-item-json.schema.js';

import type { TemplateSnippet } from './snippet.types.js';

export const subjectSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'subject entries must have a non-empty name' }),
  description: z.string().optional(),
  strengths: z.array(createTextItemSchema('strengths')).optional(),
  weaknesses: z.array(createTextItemSchema('weaknesses')).optional(),
  score: z
    .number()
    .min(0, { message: 'score must be between 0 and 10' })
    .max(10, { message: 'score must be between 0 and 10' })
    .optional(),
  scoreLabel: z.string().optional(),
});

/**
 * Evaluation subject profiles: one overview block per evaluated subject.
 * A single-subject critique carries exactly one entry; a comparison carries
 * two or more in presentation order.
 */
export const subjectsSnippet: TemplateSnippet = {
  fields: {
    subjects: z.array(subjectSchema).optional(),
  },
  instruction: `SNIPPET subject profiles (client per-subject overview blocks):
- Needs: the evaluated subjects from the request or retrieved results.
- subjects: one entry per evaluated subject, in presentation order — a single entry for a lone critique, two or more for a comparison.
- Each entry: name (REQUIRED, non-empty), description (what the subject is and how it performed), strengths: 0-5 positive points, weaknesses: 0-5 critical points (every point an object with exactly one key: "text"), and optionally score (a 0-10 JSON number, never a string, never another scale) with scoreLabel (a matching human-readable label, e.g. "8/10") — include both or omit both, per subject.`,
};
