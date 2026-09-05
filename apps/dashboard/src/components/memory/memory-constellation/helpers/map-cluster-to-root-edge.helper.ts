import type { ConstellationCluster } from '../MemoryConstellation.types';
import { clusterNodeId } from './build-cluster-node.helper';
import { ROOT_NODE_ID } from './root-node-id.constant';

/** Build a root edge from a cluster hub. */
export function mapClusterToRootEdge(cluster: ConstellationCluster) {
  return {
    source: clusterNodeId(cluster.key),
    target: ROOT_NODE_ID,
    kind: 'root' as const,
  };
}
