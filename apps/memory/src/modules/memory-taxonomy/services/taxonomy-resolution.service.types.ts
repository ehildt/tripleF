import type { MemoryTaxonomyKind } from '../../persistence/constants/memory-taxonomy.constant.js';

/**
 * Boundary of the taxonomy snap: what the deterministic resolver consumes at
 * every memory write boundary and what it reports per label.
 */

/** One label to resolve (pre-normalized by the kind's boundary normalizer). */
export interface TaxonomyLabelInput {
  /** The taxonomy tier the label belongs to. */
  kind: MemoryTaxonomyKind;
  /** Canonical-form label (already normalized at the write boundary). */
  label: string;
  /**
   * Input `label` of the parent entry resolved earlier in the same batch —
   * the strict chain: community → its category; hub → its community; node →
   * its subject. Tags are flat and pass no parent.
   */
  parentRef?: string;
}

/** Resolution outcome for one label. */
export interface TaxonomyResolvedLabel {
  /** The taxonomy tier the label belongs to. */
  kind: MemoryTaxonomyKind;
  /** The label as passed in. */
  input: string;
  /** Canonical name to store on points. */
  name: string;
  /** The tier entry this label resolved to. */
  nodeId: string;
  /** How the label resolved: exact/alias/fuzzy hit, or freshly minted. */
  how: 'exact' | 'alias' | 'fuzzy' | 'minted';
  /** Fuzzy similarity that justified a snap. */
  score?: number;
}
