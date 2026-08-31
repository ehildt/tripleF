import type { MemoryFactRecord } from '@/api/memory.api';

import type { ConstellationNode } from '../../memory-constellation/MemoryConstellation.types';

/** Cluster key for facts that carry no topic tags. */
const UNTAGGED_CLUSTER = 'untagged';
/** Cluster key grouping all synthesized bridges (derived gap-closers). */
const BRIDGE_CLUSTER = 'bridges';
/** The bridge tag written by the conviction-synthesis pass. */
const BRIDGE_TAG = 'bridge';

/** Map one stored fact record to a constellation dot. */
export function mapFactToNode(
  fact: MemoryFactRecord,
  textById: ReadonlyMap<string, string> = new Map(),
): ConstellationNode {
  const isBridge = fact.tags?.includes(BRIDGE_TAG) ?? false;
  const tags = isBridge
    ? (fact.tags ?? []).filter((tag) => tag !== BRIDGE_TAG)
    : (fact.tags?.filter(Boolean) ?? []);
  const topicKey = isBridge ? BRIDGE_CLUSTER : (tags[0] ?? UNTAGGED_CLUSTER);
  return {
    id: fact.id,
    label: isBridge ? BRIDGE_TAG : topicKey,
    topicKey,
    clusterKey: fact.clusterId?.trim() || fact.category?.trim() || undefined,
    text: fact.text,
    summary: fact.text,
    timestamp: fact.createdAt,
    keys: tags,
    meta: [
      ...(fact.role ? [{ label: 'role', value: fact.role }] : []),
      ...(fact.subject ? [{ label: 'subject', value: fact.subject }] : []),
      ...(fact.category ? [{ label: 'category', value: fact.category }] : []),
      ...(fact.kind ? [{ label: 'kind', value: fact.kind }] : []),
      ...(fact.stability
        ? [{ label: 'stability', value: fact.stability }]
        : []),
      ...(fact.createdAt
        ? [{ label: 'created', value: fact.createdAt.slice(0, 10) }]
        : []),
    ],
    isBridge,
    evidenceTexts: isBridge
      ? (fact.evidenceIds ?? []).map((id) => textById.get(id) ?? id)
      : undefined,
    isConsolidated: fact.isConsolidated,
    isReflected: fact.isReflected,
    isFriction: fact.isFriction,
    superseded: fact.superseded,
  };
}
