/**
 * One encyclopedia point = one verbatim passage of a fetched source document
 * (memory-encyclopedia collection). Chunk granularity is what makes retrieval,
 * neighbor expansion, and cache reassembly all possible from one index.
 *
 * The encyclopedia is GLOBAL: public web content shared across partitions.
 * `partitionScope` records the partition that first fetched the content —
 * provenance only, never a retrieval filter (a future tenant filter is one
 * payload match away).
 */

/** A chunk point to write (vector + payload). */
export interface EncyclopediaChunkPoint {
  /** Deterministic id: `url|contentHash|chunkIndex` — re-stores overwrite in place. */
  id: string;
  vector: number[];
  content: string;
  url: string;
  domain: string;
  title?: string;
  fetchedAt: string;
  contentHash: string;
  chunkIndex: number;
  chunkCount: number;
  partitionScope: string;
  /** `content` = fetched-document chunk; `result` = search-result snippet. */
  sourceType: 'content' | 'result';
  /** Broad family label (e.g. `games`) — the constellation category tier (cluster fallback). */
  category?: string;
  /** Plural sub-family under the category (e.g. `survival-games`) — the community tier. */
  community?: string;
  /** Narrow topic label (e.g. `wuthering waves`) — the constellation topic tier. */
  topic?: string;
  /** Mime type of the original upload (uploaded documents only). */
  mimeType?: string;
  /** Byte size of the original upload (uploaded documents only). */
  sizeBytes?: number;
  /** Content hash of the ORIGINAL upload — the MinIO object identity (uploaded documents only). */
  originalHash?: string;
  /** Lifecycle flags — written by the maintenance jobs, read by recall/display. */
  isConsolidated?: boolean;
  isLinked?: boolean;
  isReflected?: boolean;
  isFriction?: boolean;
  superseded?: boolean;
  supersededBy?: string;
}

/** A chunk read back from Qdrant (payload + optional retrieval score). */
export interface EncyclopediaChunkHit {
  id: string;
  content: string;
  url: string;
  domain: string;
  title?: string;
  fetchedAt: string;
  contentHash: string;
  chunkIndex: number;
  chunkCount: number;
  partitionScope: string;
  sourceType: 'content' | 'result';
  category?: string;
  community?: string;
  topic?: string;
  /** Detected cluster id this chunk belongs to (written by the cluster job). */
  clusterId?: string;
  /** Mime type of the original upload (uploaded documents only). */
  mimeType?: string;
  /** Byte size of the original upload (uploaded documents only). */
  sizeBytes?: number;
  /** Content hash of the ORIGINAL upload — the MinIO object identity (uploaded documents only). */
  originalHash?: string;
  isConsolidated?: boolean;
  isLinked?: boolean;
  isReflected?: boolean;
  isFriction?: boolean;
  superseded?: boolean;
  supersededBy?: string;
  score?: number;
}
