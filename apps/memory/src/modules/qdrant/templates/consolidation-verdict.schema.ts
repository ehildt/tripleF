import { z } from 'zod';

/**
 * Structured template for the consolidation sweep's adjudication step — the
 * JSON contract the model must fill. Mirrors `templates/extraction.schema.ts`:
 * the zod schema is the single source of truth; the prompt
 * (constants/memory-consolidate-prompt.constant.ts) describes the same shape
 * as text, and the job service glues output → validated verdict.
 */
export const ConsolidationVerdictSchema = z.object({
  verdict: z
    .enum(['keep', 'redundant', 'merge'])
    .describe(
      'keep = the new fact adds information not covered by the candidates; redundant = fully covered already (same claim, no new detail, same polarity); merge = it refines/corrects/completes a candidate and mergedText carries the fuller statement.',
    ),
  mergedText: z
    .string()
    .optional()
    .describe(
      'Required with verdict=merge: one fuller self-contained statement (full restatement, never a diff).',
    ),
});

export type ConsolidationVerdict = z.infer<typeof ConsolidationVerdictSchema>;
