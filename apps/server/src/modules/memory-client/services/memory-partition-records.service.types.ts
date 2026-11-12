import type { MemoryPoint } from '@triplef/agent/tools';

/**
 * Wire contract of the partition fact-record lane (`/api/v1/memory/search/text*`
 * and `DELETE /api/v1/memory/text`). The memory app owns the wire; DTO
 * mirrors are annotated per type. This lane owns the `/memory/text` endpoint
 * family, so the delete receipt shared with the cognition lane
 * (cognition-flagged deletes) lives here.
 */

/** Raw `DELETE /memory/text` response — mirror of `MemoryDeleteResponseDto` (memory-partition/dtos/memory-delete-response.dto.ts); shared with the cognition lane's deletes. */
export interface DeleteTextReceipt {
  /** Number of memory points deleted (0 when nothing matched). */
  deleted: number;
  /** The removed record texts. */
  texts: string[];
  /** Routing paths pruned from the profile document (cognition lane). */
  pruned?: string[];
}

/**
 * Semantic text-search request (`POST /memory/search/text`) — the subset of
 * `MemorySearchTextDto` (memory-partition/dtos) the server sends; the app
 * also accepts `role` and `conversationId`/`requestId` filters.
 */
export interface SearchByTextInput {
  /** Partition scope (the user-set partition or session fallback). */
  memoryPartition?: string;
  /** Cognition scope for insight and episode probes. */
  memoryCognition?: string;
  /** Restrict to one partition session. */
  sessionId?: string;
  /** Query text; embedded by the memory app. */
  text: string;
  /** Tag filter (any-match). */
  tags?: string[];
  /** Full-text containment on the record text. */
  contains?: string;
  /** Max results (the app caps at 5). */
  limit?: number;
  /** Blend recency into the ranking (episode probe). */
  recency?: boolean;
  /** Apply a bounded retrieval-heat boost after semantic candidate selection (insight probe). */
  weightByHeat?: boolean;
}

/** Mirror of `MemoryClusterDto` (memory-partition/dtos/memory-cluster.dto.ts) — one detected cluster summary. */
interface MemoryClusterRecord {
  /** Cluster id. */
  id: string;
  /** Lane the cluster belongs to ('partition' | 'encyclopedia'). */
  lane: string;
  /** Space key: the partition key, or 'global' (encyclopedia). */
  scopeKey: string;
  /** Hash of the sorted member ids — the membership-drift signal. */
  fingerprint: string;
  /** LLM-written short noun-phrase label. */
  title: string;
  /** LLM-written one/two-sentence community summary. */
  summary: string;
  /** Number of member points. */
  memberCount: number;
  /** Member point ids (authoritative membership list). */
  memberIds: string[];
  /** Hierarchy level (0 = leaf cluster over points; 1+ = cluster of synopses). */
  level: number;
  /** Parent cluster id at level+1 (absent on the top level). */
  parentId?: string;
}

/** Mirror of `MemorySearchClustersResponseDto` (memory-partition/dtos) — graph-augmented search: hits plus their cluster summaries. */
export interface SearchWithClusters {
  /** The semantic search hits (fact records). */
  points: MemoryPoint[];
  /** Cluster summaries of the clusters the hits belong to. */
  clusters: MemoryClusterRecord[];
}

/** Filtered delete request for the fact partition (`DELETE /memory/text`) — the memory-partition-delete tool. */
export interface DeleteRecordsInput {
  /** Partition scope. */
  memoryPartition: string;
  /** Restrict to one partition session. */
  sessionId?: string;
  /** Restrict to one conversation. */
  conversationId?: string;
  /** Restrict to records created by one request/turn. */
  requestId?: string;
  /** Exact text match. */
  text?: string;
  /** Full-text containment on the record text. */
  contains?: string;
  /** Tag filter (any-match). */
  tags?: string[];
}

/**
 * Delete result surface of the memory-partition-delete tool — `matched`
 * mirrors `deleted` value-for-value: the tool contract in `@triplef/agent`
 * declares it, even though the tool implementation reads only
 * `deleted`/`texts`.
 */
export interface DeleteRecordsOutcome {
  /** Number of records deleted. */
  deleted: number;
  /** The removed record texts. */
  texts: string[];
  /** Same count as `deleted` — the published tool contract's field name. */
  matched: number;
}
