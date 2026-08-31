import type {
  ConstellationCluster,
  ConstellationFriction,
  ConstellationNode,
  ConstellationPosition,
  VisibleAccumulator,
} from '../MemoryConstellation.types';
import { buildClusterNode } from './build-cluster-node.helper';

/**
 * Append every cluster's synthetic hub dot at its relaxed position —
 * cluster hubs are always visible (they are few and carry the category
 * overview), independent of member-topic collapse state. The member lookup
 * and frictions feed the hubs' leaf rollup (sources, health, freshness).
 */
export function appendClusterNodes(
  clusters: readonly ConstellationCluster[],
  relaxedPositions: ReadonlyMap<string, ConstellationPosition>,
  acc: VisibleAccumulator,
  nodeById?: ReadonlyMap<string, ConstellationNode>,
  frictions: readonly ConstellationFriction[] = [],
): void {
  for (const cluster of clusters) {
    const node = buildClusterNode(cluster, nodeById, frictions);
    acc.nodeIndex.set(node.id, acc.visibleNodes.length);
    acc.visibleNodes.push(node);
    const pos = relaxedPositions.get(node.id);
    if (pos) acc.positions.set(node.id, pos);
  }
}
