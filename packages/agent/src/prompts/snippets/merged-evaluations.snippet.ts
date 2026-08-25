import { z } from 'zod';

import { createTextItemSchema } from '../../schemas/index.js';

import { comparisonSchema } from './comparison.snippet.js';
import type { TemplateSnippet } from './snippet.types.js';
import { subjectSchema } from './subjects.snippet.js';

/**
 * One merged comparison or critique from the combined material: its own
 * subject profiles, closing comparison, reasoning, and recommendations.
 * The field/entry schemas are reused from the evaluation snippets so the
 * client renders each group through the existing evaluation components.
 */
const mergedEvaluationGroupSchema = z.object({
  title: z.string().min(1, {
    message: 'merged evaluation groups must have a non-empty title',
  }),
  relationNote: z.string().optional(),
  introduction: z.string().optional(),
  subjects: z.array(subjectSchema).optional(),
  comparison: comparisonSchema.optional(),
  reasoning: z.string().optional(),
  recommendations: z.array(createTextItemSchema('recommendations')).optional(),
});

/**
 * Merge evaluations: one structured block per comparison or critique found
 * in the combined material. Unrelated match-ups get their own entry and are
 * NEVER combined into a shared subjects/comparison — comparing subjects that
 * do not belong to the same pairing is meaningless to the client.
 */
export const mergedEvaluationsSnippet: TemplateSnippet = {
  fields: {
    mergedEvaluations: z.array(mergedEvaluationGroupSchema).optional(),
  },
  instruction: `SNIPPET merged evaluations (client per-comparison evaluation blocks):
- Render EVERY comparison or critique from the combined material as its own mergedEvaluations entry — one entry per match-up. NEVER put subjects of unrelated pairings into the same entry, and never compare subjects that do not belong to the same pairing. Several unrelated comparisons mean several entries.
- title: the match-up name (e.g. "Wuthering Waves vs Neverness to Everness"). REQUIRED for every entry.
- relationNote: one sentence stating explicitly that this match-up has nothing in common with the other merged topics — emit it ONLY for the unrelated ones; omit when related.
- introduction: 1-2 framing sentences for this match-up; optional.
- subjects: one entry per subject of THIS pairing only. Merge profiles of the same subject appearing in several selected answers into ONE entry: the description is a FULL paragraph consolidating everything the selected answers said about the subject (never a one-liner), strengths and weaknesses consolidate all source points, deduplicated; keep score (0-10 JSON number) with scoreLabel (e.g. "8/10") — both or neither, per subject.
- strengths and weaknesses entries MUST be objects with exactly one key "text": strengths: [ { "text": "Elite combat ..." }, ... ] — never bare strings.
- comparison: this pairing's closing comparison — merged criteria where each entry is exactly { "name": "<the criterion>", "scores": [ { "subject": "<exact subject name>", "score": <0-10 JSON number> }, ... ] } (an ARRAY of { subject, score } objects, never a subject→score map), merging overlapping criteria into one row, plus a winner when one subject wins, a verdict line, and a short summary. Omit for a single-subject critique.
- reasoning: a short paragraph consolidating why this pairing evaluated the way it did; optional.
- recommendations: 0-5 actionable points for THIS pairing (every entry an object with exactly one key: "text"), deduplicating points that repeat across the source answers.`,
};
