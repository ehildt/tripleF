import { z } from 'zod';

/**
 * Structured template for the taxonomy reconciliation verdict — one LLM
 * decision on whether two existing labels of the same tier name the SAME
 * concept (precision-first: a false merge contaminates every downstream
 * edge; a missed merge just delays cleanup).
 */
export const TaxonomyPairVerdictSchema = z.object({
  /**
   * `same` — the two labels name the same concept (a wording/casing/plural
   * variant) and merge. `distinct` — genuinely different concepts that only
   * look alike; keep both. When in doubt: DISTINCT.
   */
  verdict: z.enum(['same', 'distinct']),
  /** One short sentence justifying the verdict (audit trail). */
  reason: z.string().optional(),
});

export type TaxonomyPairVerdict = z.infer<typeof TaxonomyPairVerdictSchema>;
