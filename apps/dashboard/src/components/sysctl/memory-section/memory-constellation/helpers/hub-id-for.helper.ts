import type { ConstellationCluster } from '../MemoryConstellation.types';

/** The main dot id for a cluster: category dot (collapsed multi-member) or
 *  first member. Single-member clusters never collapse (there is nothing to
 *  expand), so they always resolve to their member. */
export function hubIdFor(
  cluster: ConstellationCluster,
  collapsedKeys: ReadonlySet<string>,
): string {
  return collapsedKeys.has(cluster.key) && cluster.memberIds.length > 1
    ? `cluster:${cluster.key}`
    : cluster.memberIds[0];
}
