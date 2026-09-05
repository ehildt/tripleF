import type { MemoryTaxonomyKind } from '../../persistence/constants/memory-taxonomy.constant.js';

import { TAXONOMY_SNAP_THRESHOLDS } from './taxonomy-snap.constant.js';

/**
 * Candidate floor per tier — pairs scoring below are distinct without any
 * adjudication. Between the floor and the auto-merge band (the snap
 * thresholds, reused) the pair goes to the LLM; at or above the band it
 * auto-merges ONLY when the labels share tokens (a semantic-only,
 * token-disjoint pair always gets adjudicated — research: no-overlap guard).
 */
export const TAXONOMY_RECONCILE_FLOOR: Record<MemoryTaxonomyKind, number> = {
  cluster: 0.65,
  community: 0.65,
  hub: 0.65,
  tag: 0.6,
};

/** Auto-merge band per tier (the write-boundary snap thresholds, reused). */
export const TAXONOMY_RECONCILE_AUTO = TAXONOMY_SNAP_THRESHOLDS;

/** Agreement bonus mirroring the probe fusion. */
export const RECONCILE_AGREEMENT_BONUS = 0.05;

/** Both signals at/above this count as agreement for the fusion bonus. */
export const RECONCILE_AGREEMENT_FLOOR = 0.6;

/** Hard cap on candidate pairs adjudicated per sweep run. */
export const RECONCILE_MAX_PAIRS = 500;
