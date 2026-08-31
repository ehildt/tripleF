import type {
  ConstellationNode,
  ProjectedPoint,
} from '../MemoryConstellation.types';

/** Build one cluster-opacity input from a node and its projected point. */
export function mapNodeToClusterOpacity(
  node: ConstellationNode,
  i: number,
  projected: ProjectedPoint[],
) {
  return {
    clusterKey: node.clusterKey,
    x: projected[i].x,
    y: projected[i].y,
  };
}
