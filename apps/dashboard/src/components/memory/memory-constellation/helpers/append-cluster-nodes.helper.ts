import type {
  ConstellationCluster,
  ConstellationFriction,
  ConstellationNode,
  ConstellationPosition,
  VisibleAccumulator,
} from '../MemoryConstellation.types';
import { buildClusterNode } from './build-cluster-node.helper';

/**
 * Append each populated cluster's synthetic hub dot at its relaxed position.
 * Collapsed member hubs count as descendants; a cluster with no rendered
 * descendant is omitted rather than shown as an empty hub. The member lookup
 * and frictions feed the hubs' leaf rollup (sources, health, freshness).
 */
export function appendClusterNodes(
  clusters: readonly ConstellationCluster[],
  relaxedPositions: ReadonlyMap<string, ConstellationPosition>,
  acc: VisibleAccumulator,
  nodeById?: ReadonlyMap<string, ConstellationNode>,
  frictions: readonly ConstellationFriction[] = [],
  visibleNodeIds?: ReadonlySet<string>,
): void {
  for (const cluster of clusters) {
    if (
      visibleNodeIds &&
      !cluster.memberTopicKeys.some((key) =>
        visibleNodeIds.has(`topic:${key}`),
      ) &&
      !cluster.memberIds.some((id) => visibleNodeIds.has(id))
    ) {
      continue;
    }
    const node = buildClusterNode(cluster, nodeById, frictions);
    acc.nodeIndex.set(node.id, acc.visibleNodes.length);
    acc.visibleNodes.push(node);
    const pos = relaxedPositions.get(node.id);
    if (pos) acc.positions.set(node.id, pos);
  }
}
