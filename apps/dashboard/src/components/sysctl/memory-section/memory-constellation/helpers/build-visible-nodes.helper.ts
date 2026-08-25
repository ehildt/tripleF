import type {
  ConstellationCluster,
  ConstellationNode,
  ConstellationPosition,
  VisibleAccumulator,
} from '../MemoryConstellation.types';
import { appendCategoryNode } from './append-category-node.helper';
import { appendMemberNodes } from './append-member-nodes.helper';

/**
 * Collapse collapsed clusters into a single category dot and resolve every
 * other cluster's members to their relaxed positions.
 */
export function buildVisibleNodes(
  clusters: readonly ConstellationCluster[],
  relaxedPositions: ReadonlyMap<string, ConstellationPosition>,
  nodeById: Map<string, ConstellationNode>,
  collapsedKeys: ReadonlySet<string>,
): VisibleAccumulator {
  const acc: VisibleAccumulator = {
    visibleNodes: [],
    positions: new Map(),
    nodeIndex: new Map(),
  };
  for (const cluster of clusters) {
    // A single-member cluster never collapses to a "Click to expand" dot —
    // there is nothing to expand, so its member renders directly.
    if (collapsedKeys.has(cluster.key) && cluster.memberIds.length > 1) {
      appendCategoryNode(cluster, relaxedPositions, acc);
    } else {
      appendMemberNodes(cluster, relaxedPositions, nodeById, acc);
    }
  }
  return acc;
}
