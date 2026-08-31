import type { ConstellationCluster } from '../MemoryConstellation.types';
import { hubIdFor } from './hub-id-for.helper';
import { ROOT_NODE_ID } from './root-node-id.constant';

/** Build a root edge from a cluster hub. */
export function mapClusterToRootEdge(
  cluster: ConstellationCluster,
  collapsedKeys: ReadonlySet<string>,
) {
  return {
    source: hubIdFor(cluster, collapsedKeys),
    target: ROOT_NODE_ID,
    kind: 'root' as const,
  };
}
