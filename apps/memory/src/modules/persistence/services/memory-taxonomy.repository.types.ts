import type {
  MemoryTaxonomyKind,
  MemoryTaxonomyLane,
} from '../constants/memory-taxonomy.constant.js';

/**
 * Boundary of the taxonomy registry: the tier rows the lanes read for the
 * dashboard tree, and the adopt/mint input the resolution boundary passes.
 */

/** One taxonomy node read back (the registry row). */
export interface MemoryTaxonomyNodeRecord {
  /** Tier entry id. */
  id: string;
  /** Constellation lane the label belongs to. */
  lane: MemoryTaxonomyLane;
  /** Space key: partition key / 'global'. */
  scopeKey: string;
  /** The taxonomy tier. */
  kind: MemoryTaxonomyKind;
  /** '' on roots (clusters) and flat tags. */
  parentId: string;
  /** Canonical display label. */
  name: string;
  /** Normalized lookup form. */
  normalizedName: string;
  /** Normalized icon key, when set. */
  icon?: string;
  /** LLM-written summary of what belongs under this label. */
  summary?: string;
  /** Who created the label (model, user, reconcile sweep). */
  createdBy: string;
  /** Last reflection pass under this label. */
  lastReflectedAt?: Date;
  /** Last consolidation pass under this label. */
  lastConsolidatedAt?: Date;
  /** Last relink pass under this label. */
  lastRelinkedAt?: Date;
  /** When the tier entry was created. */
  createdAt: Date;
  /** When the tier entry was last updated. */
  updatedAt: Date;
}

/** Input for adopting or minting a taxonomy node. */
export interface MemoryTaxonomyNodeInput {
  /** Constellation lane the label belongs to. */
  lane: MemoryTaxonomyLane;
  /** Space key: partition key / 'global'. */
  scopeKey: string;
  /** The taxonomy tier. */
  kind: MemoryTaxonomyKind;
  /** '' for cluster roots and flat tags. */
  parentId: string;
  /** Canonical display label as adopted. */
  name: string;
  /** Normalized lookup form (the store boundaries' canonical form). */
  normalizedName: string;
  /** Normalized icon key, when set. */
  icon?: string;
  /** LLM-written summary of what belongs under this label. */
  summary?: string;
  /** Whether the write boundary (model) or a user action minted the label. */
  createdBy: 'model' | 'user';
}

/** Which maintenance stamp a job touches on the nodes it worked under. */
export type MemoryTaxonomyMaintenanceField =
  'lastReflectedAt' | 'lastConsolidatedAt' | 'lastRelinkedAt';
