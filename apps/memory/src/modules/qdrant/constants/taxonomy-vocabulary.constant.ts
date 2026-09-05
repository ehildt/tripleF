import type { MemoryTaxonomyKind } from '../../persistence/constants/memory-taxonomy.constant.js';

/**
 * Ranked vocabulary sizes per tier for prompt injection — the labels most
 * relevant to the source text (label-embedding cosine), not a full dump.
 * Clusters get the widest window (the pick-first anchor), tags the
 * narrowest (they are recall vocabulary, not routing tiers).
 */
export const VOCABULARY_RANK_LIMITS: Record<MemoryTaxonomyKind, number> = {
  cluster: 15,
  community: 10,
  hub: 10,
  tag: 8,
};

/** Probe candidates returned to the model per call. */
export const PROBE_CANDIDATE_LIMIT = 5;

/** Semantic candidate pool size before fusion (probe + vocabulary ranking). */
export const SEMANTIC_CANDIDATE_POOL = 20;

/**
 * Floor for fused probe scores — below it a candidate is noise the model
 * should not see. Low on purpose: the probe's job is recall of plausible
 * fits, the model decides the adoption.
 */
export const PROBE_SCORE_FLOOR = 0.25;
