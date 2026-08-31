import type { EncyclopediaChunkPoint } from '../../models/encyclopedia-chunk.model.js';

/** Build one Qdrant upsert point from a encyclopedia chunk point. */
export function mapEncyclopediaPointToUpsert(point: EncyclopediaChunkPoint) {
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
      mime_type: point.mimeType,
      size_bytes: point.sizeBytes,
      original_hash: point.originalHash,
      category: point.category,
      topic: point.topic,
      is_consolidated: point.isConsolidated,
      is_linked: point.isLinked,
      is_reflected: point.isReflected,
      is_friction: point.isFriction,
      superseded: point.superseded,
      superseded_by: point.supersededBy,
    },
  };
}
