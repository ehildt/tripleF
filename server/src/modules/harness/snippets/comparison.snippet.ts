import { z } from 'zod';

import type { TemplateSnippet } from './snippet.types.js';

const criterionScoreSchema = z.object({
  subject: z.string().min(1, {
    message: 'comparison score entries must have a non-empty subject name',
  }),
  score: z
    .number()
    .min(0, { message: 'criterion scores must be between 0 and 10' })
    .max(10, { message: 'criterion scores must be between 0 and 10' }),
});

const criterionSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'comparison criteria must have a non-empty name' }),
  scores: z.array(criterionScoreSchema).optional(),
});

const comparisonSchema = z.object({
  summary: z
    .string()
    .min(1, { message: 'comparison summary must not be empty' }),
  verdict: z.string().optional(),
  winner: z.string().optional(),
  criteria: z.array(criterionSchema).optional(),
});

/**
 * Evaluation comparison: the closing head-to-head block across subjects —
 * a summary paragraph, an overall verdict with an optional declared winner,
 * and an optional criteria/scores matrix the client renders as a table.
 */
export const comparisonSnippet: TemplateSnippet = {
  fields: {
    comparison: comparisonSchema.optional(),
  },
  instruction: `SNIPPET comparison (client closing comparison across subjects):
- Include whenever two or more subjects are evaluated; omit for a single-subject critique.
- summary: a short paragraph comparing the subjects head-to-head. REQUIRED when the snippet is emitted.
- verdict: the overall conclusion (e.g. "A is the better choice for X"). winner: the exact name of the leading subject (identical to its subjects[].name); omit when there is no clear winner.
- criteria: 0-5 shared criteria, each entry: name (the criterion) and scores — one { subject, score } object per subject with a 0-10 JSON number, using the exact subject names from subjects[].name. Include a criterion only when at least one subject has enough evidence for a score.`,
};
