import type {
  ConstellationNode,
  ProjectedPoint,
} from '../MemoryConstellation.types';

/** Build one topic-opacity input from a node and its projected point. */
export function mapNodeToTopicOpacity(
  node: ConstellationNode,
  i: number,
  projected: ProjectedPoint[],
) {
  return {
    topicKey: node.topicKey,
    x: projected[i].x,
    y: projected[i].y,
  };
}
