import { z } from 'zod';

/**
 * Structured template for the memory-extraction LLM step — the JSON contract
 * the model must fill. Mirrors the harness's `templates/intent.schema.ts` role:
 * the zod schema is the single source of truth for the structured output; the
 * prompt (constants/vectorize-prompt.constant.ts) describes this same shape as
 * text, and the parse helper glues output → validated result.
 */
export const ExtractionSchema = z.object({
  /**
   * Durable, self-contained facts worth remembering in a later, unrelated
   * conversation (preferences, decisions, contact details, project facts).
   * Empty when nothing in the text is worth remembering.
   */
  facts: z.array(z.string()),
  /**
   * 2–6 stable, reusable lowercase topic labels describing the text; the open
   * vocabulary that powers topic-filtered recall.
   */
  tags: z.array(z.string()),
});

export type MemoryExtraction = z.infer<typeof ExtractionSchema>;
