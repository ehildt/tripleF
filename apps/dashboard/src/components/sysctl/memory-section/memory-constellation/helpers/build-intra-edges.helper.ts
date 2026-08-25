import type {
  ConstellationCluster,
  ConstellationEdge,
} from '../MemoryConstellation.types';

/** Intra edges: each leaf connects to its main dot (skips collapsed clusters). */
export function buildIntraEdges(
  clusters: readonly ConstellationCluster[],
  collapsedKeys: ReadonlySet<string>,
): ConstellationEdge[] {
  const edges: ConstellationEdge[] = [];
  for (const cluster of clusters) {
    if (collapsedKeys.has(cluster.key)) continue;
    const hub = cluster.memberIds[0];
    for (let i = 1; i < cluster.memberIds.length; i++) {
      edges.push({ source: hub, target: cluster.memberIds[i], kind: 'intra' });
    }
  }
  return edges;
}
