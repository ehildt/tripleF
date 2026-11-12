import type {
  ConstellationEdge,
  ConstellationNode,
  ConstellationTopic,
} from '../MemoryConstellation.types';

/** Build one expanded synthetic hub's node-tier and leaf edges. */
export function buildMainNodeIntraEdges(
  topic: ConstellationTopic,
  memberIds: readonly string[],
  nodeById?: ReadonlyMap<string, ConstellationNode>,
): ConstellationEdge[] {
  const edges: ConstellationEdge[] = [];
  const hubId = `topic:${topic.key}`;
  const linkedNodeIds = new Set<string>();
  for (const memberId of memberIds) {
    const aspect = nodeById?.get(memberId)?.node?.trim();
    if (!aspect) {
      edges.push({ source: hubId, target: memberId, kind: 'intra' });
      continue;
    }
    const nodeId = `node:${topic.key}:${aspect}`;
    if (!linkedNodeIds.has(nodeId)) {
      edges.push({ source: hubId, target: nodeId, kind: 'intra' });
      linkedNodeIds.add(nodeId);
    }
    edges.push({ source: nodeId, target: memberId, kind: 'intra' });
  }
  return edges;
}
