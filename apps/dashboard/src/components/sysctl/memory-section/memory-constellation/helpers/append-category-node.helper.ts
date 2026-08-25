import type {
  ConstellationCluster,
  ConstellationNode,
  ConstellationPosition,
  VisibleAccumulator,
} from '../MemoryConstellation.types';
import { computeRelaxedCentroid } from './compute-relaxed-centroid.helper';

/** Append a collapsed cluster's synthetic category dot at its relaxed centroid. */
export function appendCategoryNode(
  cluster: ConstellationCluster,
  relaxedPositions: ReadonlyMap<string, ConstellationPosition>,
  acc: VisibleAccumulator,
): void {
  const centroid = computeRelaxedCentroid(cluster, relaxedPositions);
  const categoryNode: ConstellationNode = {
    id: `cluster:${cluster.key}`,
    label: cluster.label,
    clusterKey: cluster.key,
    text: 'Click to expand',
    keys: [cluster.key],
    isCategory: true,
    memberCount: cluster.memberIds.length,
  };
  acc.nodeIndex.set(categoryNode.id, acc.visibleNodes.length);
  acc.visibleNodes.push(categoryNode);
  if (centroid) acc.positions.set(categoryNode.id, centroid);
}
