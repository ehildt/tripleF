import { z } from 'zod';

import type { TemplateSnippet } from './snippet.types.js';

/**
 * Evaluation spine for single-subject critiques: the subject/verdict/score
 * panel. Score and scoreLabel travel together — a numeric rating without its
 * human label (or vice versa) confuses the client panel. Multi-subject
 * comparisons omit these keys: the subjects and comparison snippets carry
 * the per-subject ratings and the closing verdict instead.
 */
export const verdictSpineSnippet: TemplateSnippet = {
  fields: {
    subject: z.string().min(1, { message: 'subject must not be empty' }).optional(),
    verdict: z.string().min(1, { message: 'verdict must not be empty' }).optional(),
    score: z
      .number()
      .min(0, { message: 'score must be between 0 and 10' })
      .max(10, { message: 'score must be between 0 and 10' })
      .optional(),
    scoreLabel: z.string().optional(),
  },
  instruction: `SNIPPET verdict block (client subject/verdict/score panel — single-subject critiques only):
- Emit these keys ONLY when the evaluation covers exactly one subject. When two or more subjects are compared, omit subject/verdict/score/scoreLabel entirely — the subjects and comparison snippets carry their place.
- subject: the item, idea, answer, or choice being evaluated, non-empty.
- verdict: a concise overall conclusion (e.g. "Recommended", "Mixed", "Not recommended"), non-empty.
- score: a numeric rating on the fixed 0-10 scale (e.g. 7.5) — always a JSON number, never a string, never another scale; scoreLabel: a matching human-readable label (e.g. "8/10", "Good"). Include both or omit both — only when a numeric rating adds value.`,
};
