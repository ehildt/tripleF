import type {
  ConstellationCluster,
  ConstellationClusterSummary,
} from '../MemoryConstellation.types';

/**
 * Attach server-detected cluster summaries to the constellation's cluster
 * hubs by EXACT key: a node's `clusterKey` is the server `cluster_id`
 * payload (written by the memory-cluster job), so the hub key already IS the
 * server cluster's id. A hub whose key matches no server record keeps its
 * label as-is (a cold scope groups by category until the job first runs).
 */
export function attachClusterSummaries(
  clusters: readonly ConstellationCluster[],
  serverClusters: readonly ConstellationClusterSummary[],
): ConstellationCluster[] {
  if (serverClusters.length === 0) return [...clusters];
  const byId = new Map(serverClusters.map((cluster) => [cluster.id, cluster]));
  return clusters.map((cluster) => {
    const server = byId.get(cluster.key);
    if (!server) return { ...cluster };
    return {
      ...cluster,
      title: server.title,
      summary: server.summary,
    };
  });
}
