import { z } from 'zod';

/**
 * Structured template for the encyclopedia research triage LLM step — the
 * JSON contract the model fills when deciding which knowledge-base gaps to
 * close (fetch + persist) and which follow-up topics to research next.
 * Mirrors the other maintenance verdict schemas (consolidation-verdict,
 * cluster-summary): the zod schema is the single source of truth, the prompt
 * describes the same shape as text, and the job parses with the tolerant
 * LLM-JSON parser.
 */

/** One gap verdict: close (fetch) or skip, plus optional follow-up topics. */
export const ResearchTriageDecisionSchema = z.object({
  /** The gap's url — echoed back so the worker maps the verdict to its candidate. */
  url: z.string(),
  /** True = fetch and persist this page; false = skip (transient/low-value). */
  close: z.boolean(),
  /** One-sentence reason — logged for observability, never shown to users. */
  reason: z.string(),
  /**
   * New topics this page (or snippet) references that the knowledge base does
   * not yet cover — the next deep-dive's search queries (the Z candidates).
   * Empty when the page is self-contained.
   */
  followUpTopics: z.array(z.string().min(1).max(200)).max(3).optional(),
});

export const ResearchTriageSchema = z.object({
  decisions: z.array(ResearchTriageDecisionSchema).max(50),
});

export type ResearchTriageDecision = z.infer<typeof ResearchTriageDecisionSchema>;
export type ResearchTriage = z.infer<typeof ResearchTriageSchema>;
