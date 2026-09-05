import type {
  ConstellationCommunity,
  ConstellationEdge,
  ConstellationTopic,
} from '../MemoryConstellation.types';
import { communityNodeId } from './build-community-node.helper';
import { hubIdFor } from './hub-id-for.helper';

/**
 * Community edges: each member topic's main dot connects to its community
 * hub, and each community hub connects up to its parent cluster hub —
 * the mid-tier chain `topic → community → cluster`. Same-community topics
 * therefore relate through their shared sub-family dot.
 */
export function buildCommunityEdges(
  topics: readonly ConstellationTopic[],
  communities: readonly ConstellationCommunity[],
  collapsedKeys: ReadonlySet<string>,
): ConstellationEdge[] {
  const topicByKey = new Map(topics.map((topic) => [topic.key, topic]));
  const edges: ConstellationEdge[] = [];
  for (const community of communities) {
    for (const topicKey of community.memberTopicKeys) {
      const topic = topicByKey.get(topicKey);
      if (!topic) continue;
      edges.push({
        source: hubIdFor(topic, collapsedKeys),
        target: communityNodeId(community.key),
        kind: 'community',
      });
    }
  }
  return edges;
}
