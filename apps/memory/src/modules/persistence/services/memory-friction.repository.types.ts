import type { MemoryLane } from '../constants/memory-lane.constant.js';

/**
 * Boundary of the friction registry: detected contradictions between memory
 * points, from detection (research/contention input) to dashboard edges.
 */

/** The three constellation lanes — one per memory layer (MemoryLane alias). */
export type MemoryFrictionLane = MemoryLane;

/** Friction kind — the reflection pass classifies the conflict. */
export type MemoryFrictionKind =
  'contradiction' | 'superseded' | 'outdated' | 'disagreement';

/** Friction lifecycle state. */
export type MemoryFrictionStatus = 'open' | 'resolved' | 'dismissed';

/** One friction read back for the dashboard. */
export interface MemoryFrictionEdge {
  /** Point id of the friction's first side. */
  source: string;
  /** Point id of the friction's second side. */
  target: string;
  /** The classified conflict kind. */
  kind: MemoryFrictionKind;
  /** Lifecycle state. */
  status: MemoryFrictionStatus;
  /** Why the pair was flagged (verdict explanation). */
  reason?: string;
  /** How the friction was resolved, when resolved. */
  resolution?: string;
}

/**
 * One open friction with its identity — the research job's contention input
 * (id + pair point ids + lane so the worker can load the pair's texts from
 * the right Qdrant collection).
 */
export interface MemoryFrictionRecord {
  /** Friction row id. */
  id: string;
  /** Constellation lane. */
  lane: MemoryFrictionLane;
  /** Space key: partition key / 'global'. */
  scopeKey: string;
  /** Point id of the friction's first side. */
  source: string;
  /** Point id of the friction's second side. */
  target: string;
  /** The classified conflict kind. */
  kind: MemoryFrictionKind;
  /** Why the pair was flagged (verdict explanation). */
  reason?: string;
}
