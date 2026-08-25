import type { ConstellationCluster } from '../MemoryConstellation.types';

/** The main dot id for a cluster: category dot (collapsed) or first member. */
export function hubIdFor(
  cluster: ConstellationCluster,
  collapsedKeys: ReadonlySet<string>,
): string {
  return collapsedKeys.has(cluster.key)
    ? `cluster:${cluster.key}`
    : cluster.memberIds[0];
}
