import type { MemoryTaxonomyKind } from '../../persistence/constants/memory-taxonomy.constant.js';

/**
 * Fuzzy (trigram) auto-snap thresholds per taxonomy tier — above the
 * threshold a model-written label snaps to the existing canonical tier entry
 * and leaves a `fuzzy` alias; below it the label mints a new tier entry. Precision
 * first (research): a false merge contaminates every downstream edge, a
 * missed merge is cleaned up by the reconciliation sweep. Hubs/nodes/tags
 * are entity-like and get a slightly looser bar than the family tiers.
 */
export const TAXONOMY_SNAP_THRESHOLDS: Record<MemoryTaxonomyKind, number> = {
  cluster: 0.92,
  community: 0.92,
  hub: 0.9,
  node: 0.9,
  tag: 0.88,
};
