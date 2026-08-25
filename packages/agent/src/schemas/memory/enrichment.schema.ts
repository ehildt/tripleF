import { z } from 'zod';

/**
 * Structured template for the relink job's optional enrichment step — the
 * JSON contract the model must fill when refining one stored record's topic
 * labels. Mirrors `extraction.schema.ts`: the zod schema is the single source
 * of truth; the prompt (prompts/memory/memory-enrich-prompt.constant.ts)
 * describes the same shape as text, and the job service glues output →
 * validated tags.
 */
export const MemoryEnrichmentSchema = z.object({
  /**
   * 2–6 stable, reusable lowercase topic labels for the record — the existing
   * tags kept plus any missing labels that would help topic-filtered recall.
   */
  tags: z.array(z.string()),
});

export type MemoryEnrichment = z.infer<typeof MemoryEnrichmentSchema>;
