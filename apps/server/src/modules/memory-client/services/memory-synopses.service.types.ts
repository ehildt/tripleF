/**
 * Wire contract of the cluster-synopsis probe lane
 * (`/api/v1/memory/search/synopses`). The memory app owns the wire.
 */

/** Mirror of `MemorySynopsisDto` (memory-partition/dtos/memory-synopsis.dto.ts) — the Raptor probe record (community summary + level). */
export interface SynopsisHit {
  /** Id of the cluster this synopsis summarizes. */
  clusterId: string;
  /** Space key: the partition key, or 'global' (encyclopedia). */
  scopeKey: string;
  /** Hierarchy level (0 = leaf summaries over record clusters). */
  level: number;
  /** LLM-written short noun-phrase label. */
  title: string;
  /** LLM-written one/two-sentence community summary. */
  summary: string;
  /** Direct members of the summarized cluster. */
  memberCount: number;
  /** Cosine similarity to the query. */
  score?: number;
}

/** Synopsis search request — partition lane when `memoryPartition` is set, global encyclopedia synopses when omitted. */
export interface SearchSynopsesInput {
  /** Partition scope; omit for the global encyclopedia synopsis lane. */
  memoryPartition?: string;
  /** Query text; embedded by the memory app. */
  text: string;
  /** Max synopsis hits. */
  limit?: number;
}
