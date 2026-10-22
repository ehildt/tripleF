import type { MemoryClusterRow } from '../../../../../persistence/services/memory-cluster.repository.types.js';
import { CLUSTER_TITLE_LIMIT } from '../../../../../qdrant/constants/cluster.constant.js';

/**
 * Fallback title for an upper-level (synopsis) cluster when the summary
 * verdict is unparseable: the largest child cluster's title.
 */
export function fallbackTitleOfClusters(members: MemoryClusterRow[]): string {
  const largest = [...members].sort((a, b) => b.memberCount - a.memberCount)[0];
  return (largest?.title.trim() ?? 'untitled').slice(0, CLUSTER_TITLE_LIMIT);
}
