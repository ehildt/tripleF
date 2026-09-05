import type { EncyclopediaSearchHit } from '@triplef/agent/schemas';

import type { EncyclopediaChunkHit } from '../../../qdrant/models/encyclopedia-chunk.model.js';

/**
 * Project a stored chunk hit into the agentic search wire shape — the lean
 * view the encyclopedia-search tool renders (no partitioning or lifecycle
 * internals).
 */
export function mapHitToSearchHit(
  hit: EncyclopediaChunkHit,
): EncyclopediaSearchHit {
  return {
    url: hit.url,
    title: hit.title,
    domain: hit.domain,
    content: hit.content,
    score: hit.score ?? 0,
    chunkIndex: hit.chunkIndex,
    chunkCount: hit.chunkCount,
    sourceType: hit.sourceType,
    fetchedAt: hit.fetchedAt,
  };
}
