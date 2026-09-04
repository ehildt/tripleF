import { z } from 'zod';

/**
 * Structured template for the research job's contested-memory step — the
 * JSON contract the model fills when deciding whether an open memory friction
 * (a pair of contradictory statements) can be settled by fetching external
 * evidence, and if so, which single search query would fetch it. Mirrors the
 * other maintenance verdict schemas: the zod schema is the single source of
 * truth, the prompt describes the same shape as text, and the job parses
 * with the tolerant LLM-JSON parser.
 */

/** One contested-pair verdict: web-checkable (query below) or subjective. */
export const ResearchFrictionQueryDecisionSchema = z.object({
  /** The friction id — echoed back so the worker maps the verdict to its candidate. */
  id: z.string(),
  /**
   * True = a public web search can plausibly settle the dispute (a spec, a
   * date, a version, an event); false = subjective or user-specific, no page
   * settles it — the friction stays for the reflection cycle.
   */
  checkable: z.boolean(),
  /**
   * The single resolution-seeking search query (2–8 words) — present only
   * when checkable. Worded to fetch decisive evidence, not to restate the
   * claim.
   */
  query: z.string().min(2).max(200).optional(),
});

export const ResearchFrictionQuerySchema = z.object({
  decisions: z.array(ResearchFrictionQueryDecisionSchema).max(20),
});

export type ResearchFrictionQueryDecision = z.infer<typeof ResearchFrictionQueryDecisionSchema>;
export type ResearchFrictionQuery = z.infer<typeof ResearchFrictionQuerySchema>;
