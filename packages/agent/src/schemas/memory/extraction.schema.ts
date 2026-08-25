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
   * vocabulary that powers topic-filtered recall. Tags are NARROW and
   * specific — entity names, product names, game titles (e.g. `amd`,
   * `stellar blade`, `stellar blade blood rain`).
   */
  tags: z.array(z.string()),
  /**
   * One broad lowercase PLURAL family label for the whole turn-side (e.g.
   * `stocks`, `pets`, `games`) — groups the narrow tags into one topic family
   * for the constellation's community tier and the relink job's per-category
   * passes. Never a specific entity, product, company, or game title: `amd`
   * belongs under `stocks`; `stellar blade` belongs under `games`. Optional:
   * a turn with nothing durable may omit it.
   */
  category: z.string().optional(),
});

export type MemoryExtraction = z.infer<typeof ExtractionSchema>;
