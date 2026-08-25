/**
 * One lexicon point = one verbatim passage of a fetched source document
 * (memory-lexicon collection). Chunk granularity is what makes retrieval,
 * neighbor expansion, and cache reassembly all possible from one index.
 *
 * The lexicon is GLOBAL: public web content shared across partitions.
 * `partitionScope` records the partition that first fetched the content —
 * provenance only, never a retrieval filter (a future tenant filter is one
 * payload match away).
 */

/** A chunk point to write (vector + payload). */
export interface LexiconChunkPoint {
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
}

/** A chunk read back from Qdrant (payload + optional retrieval score). */
export interface LexiconChunkHit {
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
  score?: number;
}
