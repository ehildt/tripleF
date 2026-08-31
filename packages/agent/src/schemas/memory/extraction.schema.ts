import { z } from 'zod';

/**
 * Structured template for the memory-extraction LLM step — the JSON contract
 * the model must fill. Mirrors the harness's `templates/intent.schema.ts` role:
 * the zod schema is the single source of truth for the structured output; the
 * prompt (constants/vectorize-prompt.constant.ts) describes this same shape as
 * text, and the parse helper glues output → validated result.
 */

/**
 * What KIND of durable thing a fact is — the primary maintenance knob:
 * reflect screens preferences/relationships for polarity flips and lets
 * newer `state` supersede older ones, while consolidate merges `contact` and
 * `state` records about the same subject aggressively and never folds two
 * `decision` records into one.
 */
export const FACT_KINDS = [
  'preference',
  'decision',
  'state',
  'contact',
  'project',
  'possession',
  'relationship',
  'fact',
] as const;

/**
 * How likely the fact is to be replaced by a later statement:
 * `durable` — a long-term truth (a decision, a trait, a history fact);
 * `volatile` — a current state that newer statements supersede (location,
 * tooling, versions).
 */
export const FACT_STABILITIES = ['durable', 'volatile'] as const;

/** One extracted fact with its maintenance metadata. */
export const ExtractedFactSchema = z.object({
  /**
   * The self-contained durable statement — third person, subject up front,
   * no "this"/"that" references.
   */
  text: z.string(),
  /**
   * The lowercase entity the fact is about (default `user`; a person,
   * product, or project name). Maintenance adjudication only ever compares
   * facts about the SAME subject.
   */
  subject: z.string().optional(),
  /**
   * One broad lowercase PLURAL family label for THIS fact (e.g. `stocks`,
   * `pets`, `games`) — inherits the turn-side category when omitted. Never
   * a specific entity, product, company, or game title.
   */
  category: z.string().optional(),
  /** What kind of durable thing this is (see FACT_KINDS). */
  kind: z.enum(FACT_KINDS),
  /** Whether a newer statement is expected to replace this one (see FACT_STABILITIES). */
  stability: z.enum(FACT_STABILITIES),
});

export type ExtractedFact = z.infer<typeof ExtractedFactSchema>;

export const ExtractionSchema = z.object({
  /**
   * Durable, self-contained facts worth remembering in a later, unrelated
   * conversation (preferences, decisions, contact details, project facts),
   * each carrying its maintenance metadata (subject, category, kind,
   * stability). Empty when nothing in the text is worth remembering.
   */
  facts: z.array(ExtractedFactSchema),
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
   * passes, and backstops facts that omit their own `category`. Never a
   * specific entity, product, company, or game title: `amd` belongs under
   * `stocks`; `stellar blade` belongs under `games`. Optional: a turn with
   * nothing durable may omit it.
   */
  category: z.string().optional(),
});

export type MemoryExtraction = z.infer<typeof ExtractionSchema>;
