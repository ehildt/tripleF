import type { LexiconChunkPoint } from '../../models/lexicon-chunk.model.js';

/** Build one Qdrant upsert point from a lexicon chunk point. */
export function mapLexiconPointToUpsert(point: LexiconChunkPoint) {
  return {
    id: point.id,
    vector: point.vector,
    payload: {
      content: point.content,
      url: point.url,
      domain: point.domain,
      title: point.title,
      fetched_at: point.fetchedAt,
      content_hash: point.contentHash,
      chunk_index: point.chunkIndex,
      chunk_count: point.chunkCount,
      partition_scope: point.partitionScope,
      source_type: point.sourceType,
    },
  };
}
