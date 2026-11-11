import type {
  ConstellationCommunity,
  ConstellationPosition,
} from '../MemoryConstellation.types';
import { calcMeanPosition } from './calc-mean-position.helper';

/** Build a community hub seed from its member topics' centroids. */
export function buildCommunitySeed(
  community: ConstellationCommunity,
  centroids: ReadonlyMap<string, ConstellationPosition>,
): ConstellationPosition {
  return calcMeanPosition(
    community.memberTopicKeys.map((topicKey) => centroids.get(topicKey)),
  );
}
