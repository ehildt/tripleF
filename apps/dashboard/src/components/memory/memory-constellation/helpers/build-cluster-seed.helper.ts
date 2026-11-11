import type {
  ConstellationCluster,
  ConstellationPosition,
} from '../MemoryConstellation.types';
import { communityNodeId } from './build-community-node.helper';
import { calcMeanPosition } from './calc-mean-position.helper';

/**
 * Build a cluster hub seed from its community seeds and community-less member
 * topics' centroids. The force pass then settles the hub between them.
 */
export function buildClusterSeed(
  cluster: ConstellationCluster,
  communityIdByTopic: ReadonlyMap<string, string>,
  centroids: ReadonlyMap<string, ConstellationPosition>,
  seed: ReadonlyMap<string, ConstellationPosition>,
): ConstellationPosition {
  return calcMeanPosition([
    ...cluster.memberCommunityKeys.map((communityKey) =>
      seed.get(communityNodeId(communityKey)),
    ),
    ...cluster.memberTopicKeys
      .filter((topicKey) => !communityIdByTopic.has(topicKey))
      .map((topicKey) => centroids.get(topicKey)),
  ]);
}
