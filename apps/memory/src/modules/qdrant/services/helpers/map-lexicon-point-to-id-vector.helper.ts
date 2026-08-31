import type { LexiconChunkPoint } from '../../models/lexicon-chunk.model.js';

/** Project a lexicon chunk point into its id/vector pair. */
export function mapLexiconPointToIdVector(point: LexiconChunkPoint) {
  return { id: point.id, vector: point.vector };
}
