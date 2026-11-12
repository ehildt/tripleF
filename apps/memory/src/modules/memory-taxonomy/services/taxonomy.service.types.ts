import type { MemoryTaxonomyNodeRecord } from '../../persistence/services/memory-taxonomy.repository.types.js';

/** Payload fields backing the partition taxonomy tiers. */
export type PartitionTaxonomyField =
  'category' | 'community' | 'subject' | 'node' | 'tags';

/** Payload fields backing the encyclopedia taxonomy tiers. */
export type EncyclopediaTaxonomyField =
  'category' | 'community' | 'topic' | 'node';

/** Aggregated operational counts for one registry row. */
export interface TaxonomyLeafCount {
  leafCount: number;
  linkedCount: number;
}

/**
 * Boundary of the taxonomy management surface: the dashboard tree read
 * shapes (node rows and their leaves).
 */

/** One taxonomy node with its operational metadata, for the dashboard. */
export interface TaxonomyNodeView {
  /** Tier entry id. */
  id: string;
  /** The taxonomy tier. */
  kind: MemoryTaxonomyNodeRecord['kind'];
  /** '' on roots (clusters) and flat tags. */
  parentId: string;
  /** Canonical label. */
  name: string;
  /** Normalized icon key, when set. */
  icon?: string;
  /** LLM-written summary of what belongs under this label. */
  summary?: string;
  /** Who created the label (agent, user, reconcile sweep). */
  createdBy: string;
  /** Leaves attached to this label (Qdrant point count). */
  leafCount: number;
  /** Leaves with at least one constellation link edge. */
  linkedCount: number;
  /** Direct children in the taxonomy tree. */
  childCount: number;
  /** Killed wordings that resolve to this label. */
  aliases: Array<{
    /** The historical wording. */
    alias: string;
    /** Which mechanism wrote the alias (exact merge, fuzzy snap, adjudication). */
    source: string;
    /** Fuzzy similarity at snap time, when fuzzy-sourced. */
    score?: number;
    /** When the alias was written. */
    createdAt: Date;
  }>;
  /** Last reflection pass touching this label. */
  lastReflectedAt?: Date;
  /** Last consolidation pass touching this label. */
  lastConsolidatedAt?: Date;
  /** Last relink pass touching this label. */
  lastRelinkedAt?: Date;
  /** When the tier entry was created. */
  createdAt: Date;
  /** When the tier entry was last updated. */
  updatedAt: Date;
}

/**
 * One leaf attached to a taxonomy node (the dashboard drill's leaf listing):
 * lane-normalized. Encyclopedia chunks of one source page collapse into ONE
 * leaf — a source page is the entry the user means, and one row per chunk
 * would repeat the same URL for every snippet/content slice of the page.
 */
export interface TaxonomyLeafView {
  /** The first group member's point id (stable row key). */
  id: string;
  /** Partition: the fact text. Encyclopedia: the first titled chunk's title,
   * else the source URL. */
  text: string;
  /** Encyclopedia sources link back to their page. */
  href?: string;
  /** Any member chunk carries a constellation link edge. */
  linked: boolean;
  /** Latest stamp across the group (partition createdAt / encyclopedia fetchedAt). */
  stampedAt?: string;
  /** The point ids folded into this leaf (single-member rows: their own id). */
  memberIds: string[];
}
