import type { MemoryLane } from '../constants/memory-lane.constant.js';

/**
 * Boundary of the link graph: undirected weighted edges between memory
 * points — the dashboard reads edges, the relink/store paths write rows.
 */

/** The three constellation lanes — one per memory layer (MemoryLane alias). */
export type MemoryLinkLane = MemoryLane;

/** Edge kind: `semantic` = enforced kNN link (store paths); `topical` =
 * suggested link (relink job — recall ignores it, the dashboard may render
 * it faintly); `evidence` = a bridge record's citation edge to a fact it
 * synthesizes (conviction store path — exact, not similarity-derived). One
 * edge per pair: the unique constraint keeps a single row, and semantic wins
 * when both would apply.
 */
export type MemoryLinkKind = 'semantic' | 'topical' | 'evidence';

/** One undirected edge read back for the dashboard. */
export interface MemoryLinkEdge {
  /** Point id of the edge's first side. */
  source: string;
  /** Point id of the edge's second side. */
  target: string;
  /** Similarity score behind the link. */
  score: number;
  /** The link kind. */
  kind: MemoryLinkKind;
}

/** One edge row to write (canonical source < target ordering). */
export interface MemoryLinkRow {
  /** Constellation lane. */
  lane: MemoryLinkLane;
  /** Qdrant collection the linked points live in. */
  collection: string;
  /** Space key: partition key / 'global'. */
  scopeKey: string;
  /** Canonically lower point id of the pair. */
  source: string;
  /** Canonically higher point id of the pair. */
  target: string;
  /** Similarity score behind the link. */
  score: number;
  /** The link kind. */
  kind: MemoryLinkKind;
}
