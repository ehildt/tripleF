import type { MemoryFactRecord } from '@/api/memory.api';

import type { ConstellationNode } from '../../memory-constellation/MemoryConstellation.types';
import { mapFactToNode } from './map-fact-to-node.helper';

/**
 * Map stored fact records to constellation dots: the primary tag is the
 * topic key (untagged facts group together), the broad `category` is the
 * cluster key (second-level grouping of related topics into one family,
 * e.g. `nte` + `wuthering waves` under `games`), all tags drive the
 * co-occurrence links, and the timestamp drives the temporal chain.
 */
export function buildPartitionNodes(
  facts: readonly MemoryFactRecord[],
): ConstellationNode[] {
  const textById = new Map(facts.map((fact) => [fact.id, fact.text]));
  return facts.map((fact) => mapFactToNode(fact, textById));
}
