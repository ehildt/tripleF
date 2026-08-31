import type { EncyclopediaChunkPoint } from '../../models/encyclopedia-chunk.model.js';

/** Project a encyclopedia chunk point into its id/vector pair. */
export function mapEncyclopediaPointToIdVector(point: EncyclopediaChunkPoint) {
  return { id: point.id, vector: point.vector };
}
