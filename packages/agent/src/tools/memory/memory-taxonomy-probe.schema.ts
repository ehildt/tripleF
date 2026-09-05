import { z } from 'zod';

/**
 * Input contract of the `memory-taxonomy-probe` tool — the model's
 * pick-or-create loop over the macro-taxonomy: probe a tier with the label
 * you intend to use; the result lists the closest existing nodes (ids +
 * names + scores) so the model adopts one VERBATIM or knowingly creates a
 * new, correctly-phrased label.
 */
export const memoryTaxonomyProbeSchema = z.object({
  kind: z
    .enum(['cluster', 'community', 'hub'])
    .describe(
      'Which tier to probe. Top-down order: cluster (PLURAL family noun) → community (PLURAL sub-family under one cluster) → hub (SINGULAR main subject entity).',
    ),
  query: z
    .string()
    .min(1)
    .max(120)
    .describe(
      'The label you are considering (e.g. "games", "survival games", "project zomboid") — scored against the existing taxonomy by name similarity and meaning.',
    ),
  parentId: z
    .string()
    .optional()
    .describe(
      'The adopted node id from the tier ABOVE (community probes pass the adopted cluster id; hub probes pass the adopted community or cluster id). Narrows the candidacy to that parent; omit only when you are about to CREATE the parent.',
    ),
});

export type MemoryTaxonomyProbeInput = z.infer<typeof memoryTaxonomyProbeSchema>;
