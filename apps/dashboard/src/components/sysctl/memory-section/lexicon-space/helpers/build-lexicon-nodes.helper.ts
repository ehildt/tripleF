import type { LexiconChunkRecord } from '@/api/memory.api';

import type { ConstellationNode } from '../../memory-constellation/MemoryConstellation.types';
import { mapChunkToNode } from './map-chunk-to-node.helper';

/**
 * Map stored lexicon chunks to constellation dots: the source domain is the
 * cluster key and the dot label, the url + domain drive the co-occurrence
 * links, and the fetch timestamp drives the temporal chain.
 */
export function buildLexiconNodes(
  chunks: readonly LexiconChunkRecord[],
): ConstellationNode[] {
  return chunks.map(mapChunkToNode);
}
