import { z } from 'zod';

/**
 * Structured template for the memory-cluster job's summarization step — the
 * JSON contract the model fills for one detected cluster (a group of
 * related memory points). Mirrors the other memory verdict schemas: the zod
 * schema is the single source of truth; the prompt
 * (memory-cluster-prompt.constant.ts) describes the same shape as text, and
 * the job service glues output → validated summary.
 */
export const MemoryClusterSummarySchema = z.object({
  title: z
    .string()
    .describe('A short noun-phrase label for the cluster (2–6 words), e.g. "gaming preferences" or "work projects".'),
  summary: z
    .string()
    .describe(
      'One or two sentences summarizing what this cluster of memories is about — the shared theme, the key facts, and how they relate.',
    ),
});

export type MemoryClusterSummary = z.infer<typeof MemoryClusterSummarySchema>;
