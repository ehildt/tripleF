import type {
  ConstellationEdge,
  ConstellationNode,
  ConstellationTopic,
} from '../MemoryConstellation.types';
import { buildMainNodeIntraEdges } from './build-main-node-intra-edges.helper';

/**
 * Intra edges: expanded hubs connect to their populated node tiers, and each
 * classified leaf connects to its node; legacy/unclassified leaves connect
 * directly to the hub. Collapsed topics hide all descendants. Under the
 * main-node regime the hub is the synthetic title dot; otherwise it is the
 * first member. The optional visible-id set keeps edges aligned with the
 * render pass's stray-leaf filtering.
 */
export function buildIntraEdges(
  topics: readonly ConstellationTopic[],
  collapsedKeys: ReadonlySet<string>,
  mainNodesEnabled = false,
  nodeById?: ReadonlyMap<string, ConstellationNode>,
  visibleNodeIds?: ReadonlySet<string>,
): ConstellationEdge[] {
  const edges: ConstellationEdge[] = [];
  for (const topic of topics) {
    if (collapsedKeys.has(topic.key)) continue;
    if (!mainNodesEnabled && topic.memberIds.length < 2) continue;
    const memberIds = topic.memberIds.filter(
      (memberId) => visibleNodeIds?.has(memberId) ?? true,
    );
    if (memberIds.length === 0) continue;
    if (mainNodesEnabled) {
      edges.push(...buildMainNodeIntraEdges(topic, memberIds, nodeById));
      continue;
    }
    const hub = topic.memberIds[0];
    for (const memberId of memberIds) {
      if (memberId !== hub) {
        edges.push({ source: hub, target: memberId, kind: 'intra' });
      }
    }
  }
  return edges;
}
