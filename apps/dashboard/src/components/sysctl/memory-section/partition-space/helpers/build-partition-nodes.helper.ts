import type { MemoryFactRecord } from '@/api/memory.api';

import type { ConstellationNode } from '../../memory-constellation/MemoryConstellation.types';

/** Cluster key for facts that carry no topic tags. */
const UNTAGGED_CLUSTER = 'untagged';

/**
 * Map stored fact records to constellation dots: the primary tag is the
 * cluster key (untagged facts group together), the broad `category` is the
 * community key (second-level grouping of related topics into one family,
 * e.g. `nte` + `wuthering waves` under `games`), all tags drive the
 * co-occurrence links, and the timestamp drives the temporal chain.
 */
export function buildPartitionNodes(
  facts: readonly MemoryFactRecord[],
): ConstellationNode[] {
  return facts.map((fact) => {
    const tags = fact.tags?.filter(Boolean) ?? [];
    const clusterKey = tags[0] ?? UNTAGGED_CLUSTER;
    return {
      id: fact.id,
      label: clusterKey,
      clusterKey,
      communityKey: fact.category?.trim() || undefined,
      text: fact.text,
      summary: fact.text,
      timestamp: fact.createdAt,
      keys: tags,
      meta: [
        ...(fact.role ? [{ label: 'role', value: fact.role }] : []),
        ...(fact.createdAt
          ? [{ label: 'created', value: fact.createdAt.slice(0, 10) }]
          : []),
      ],
    };
  });
}
