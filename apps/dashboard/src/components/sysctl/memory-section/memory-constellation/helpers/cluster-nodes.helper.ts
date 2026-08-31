import type {
  ConstellationCluster,
  ConstellationNode,
} from '../MemoryConstellation.types';
import { mapClusterEntry } from './map-cluster-entry.helper';

/**
 * Group nodes by their `clusterKey` into cluster blobs, assigning each a
 * stable palette color. Cluster order follows first-seen key order, so the
 * layout is deterministic for a given node list.
 */
export function clusterNodes(
  nodes: readonly ConstellationNode[],
): ConstellationCluster[] {
  const byKey = new Map<string, string[]>();
  for (const node of nodes) {
    const members = byKey.get(node.clusterKey) ?? [];
    members.push(node.id);
    byKey.set(node.clusterKey, members);
  }
  return [...byKey.entries()].map(mapClusterEntry);
}
