import type { LexiconChunkHit } from '../../../qdrant/models/lexicon-chunk.model.js';

/** Project a lexicon hit into the selected-chunk shape. */
export function mapHitToChunk(hit: LexiconChunkHit) {
  return {
    url: hit.url,
    title: hit.title,
    content: hit.content,
    score: hit.score ?? 0,
    sourceType: 'content' as const,
  };
}
