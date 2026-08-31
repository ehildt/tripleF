import type { MemoryFactRecord } from '@/api/memory.api';

import type { ConstellationNode } from '../../memory-constellation/MemoryConstellation.types';

/** Cluster key for facts that carry no topic tags. */
const UNTAGGED_CLUSTER = 'untagged';

/** Map one stored fact record to a constellation dot. */
export function mapFactToNode(fact: MemoryFactRecord): ConstellationNode {
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
}
