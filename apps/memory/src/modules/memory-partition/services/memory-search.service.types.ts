import type { MemoryClusterRecord } from '../../persistence/services/memory-cluster.repository.types.js';
import type {
  MemoryPoint,
  MemoryScopeFilters,
} from '../../qdrant/models/memory.model.js';

/** One partition search probe — the lane's lane-scoped filters plus ranking knobs. */
export interface SearchInput extends MemoryScopeFilters {
  /** Max hits. */
  limit?: number;
  /** Blend recency into the ranking (episode probe). */
  recency?: boolean;
  /** Apply a bounded retrieval-heat boost after semantic candidate selection (cognition probes). */
  weightByHeat?: boolean;
  /**
   * Track retrieval heat for this search's hits (default true). Background
   * bookkeeping probes (extract/write/profile prior-fact probes, consolidate
   * and relink sweeps) pass false — maintenance retrievals are not user
   * engagement and must not heat up records.
   */
  trackHeat?: boolean;
}

/** Search result with the hits' cluster summaries attached (graph-augmented recall). */
export interface MemorySearchWithClusters {
  /** Plain kNN hits. */
  points: MemoryPoint[];
  /** Cluster synopses of the clusters those hits belong to. */
  clusters: MemoryClusterRecord[];
}
