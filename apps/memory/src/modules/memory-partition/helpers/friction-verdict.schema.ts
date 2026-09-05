import { z } from 'zod';

/**
 * Structured template for the reflection pass's friction screen — the JSON
 * contract the model fills when judging whether one record contradicts any of
 * its near-neighbor candidates. Contradiction is a semantic conflict (a
 * negation, a polarity flip, a superseding update), NOT mere redundancy —
 * redundancy is the consolidation pass's job.
 */
export const FrictionVerdictSchema = z.object({
  /**
   * True when the record contradicts at least one candidate. False when the
   * record and its candidates are compatible (or merely redundant).
   */
  contradicts: z.boolean(),
  /**
   * The candidate point id that conflicts with the record — required when
   * `contradicts` is true. The record's own id is supplied in the prompt, so
   * the model only ever names a candidate here.
   */
  conflictingId: z.string().optional(),
  /**
   * The point id that is correct — either the record's id or `conflictingId`.
   * When set, the OTHER point is superseded (marked stale, never deleted).
   * Omitted when the conflict is genuine but neither side is clearly right
   * (the friction stays open for the recall annotation to surface).
   */
  winnerId: z.string().optional(),
  /**
   * One-sentence description of the conflict and, when a winner is named,
   * why that side wins (e.g. "the later statement supersedes the earlier").
   */
  reason: z.string().optional(),
});

export type FrictionVerdict = z.infer<typeof FrictionVerdictSchema>;
