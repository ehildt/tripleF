import type { EncyclopediaChunkHit } from '../../../qdrant/models/encyclopedia-chunk.model.js';

/** Project a encyclopedia hit into the selected-chunk shape. */
export function mapHitToChunk(hit: EncyclopediaChunkHit) {
  return {
    url: hit.url,
    title: hit.title,
    content: hit.content,
    score: hit.score ?? 0,
    sourceType: 'content' as const,
  };
}
