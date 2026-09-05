import type { EncyclopediaChunkRecord } from '@/api/memory.api';

import type { ConstellationNode } from '../../memory-constellation/MemoryConstellation.types';
import { mapChunkToNode } from './map-chunk-to-node.helper';

/**
 * Map stored encyclopedia chunks to constellation dots: the source-agnostic topic
 * is the topic key and dot label, the broad category is the cluster key
 * (second-level grouping), the domain + url drive the co-occurrence links,
 * and the fetch timestamp drives the temporal chain. Unclassified chunks fall
 * back to domain clustering until the classify job labels them.
 */
export function buildEncyclopediaNodes(
  chunks: readonly EncyclopediaChunkRecord[],
): ConstellationNode[] {
  return chunks.map(mapChunkToNode);
}
