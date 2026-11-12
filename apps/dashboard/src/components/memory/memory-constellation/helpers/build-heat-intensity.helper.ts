import type {
  ConstellationCluster,
  ConstellationCommunity,
  ConstellationNode,
  ConstellationTopic,
} from '../MemoryConstellation.types';
import { clusterNodeId } from './build-cluster-node.helper';
import { communityNodeId } from './build-community-node.helper';

/**
 * Normalized retrieval heat per node id (0..1) — the halo warmth channel.
 * Leaves normalize against the hottest leaf; hub dots carry their members'
 * summed heat, normalized against the hottest hub of THEIR tier (rollups are
 * sums — one shared scale would let a big cluster outshine every leaf). The
 * sqrt dampening keeps one hot item from cooling everything else. A scene
 * the store never tracked (no `heatAmount` payloads) is all-zero.
 */
export function buildHeatIntensity(
  nodes: readonly ConstellationNode[],
  topics: readonly ConstellationTopic[],
  communities: readonly ConstellationCommunity[],
  clusters: readonly ConstellationCluster[],
  mainNodesEnabled = false,
): Map<string, number> {
  const ownHeat = new Map(nodes.map((node) => [node.id, node.heatAmount ?? 0]));
  const sumOf = (ids: readonly string[]): number =>
    ids.reduce((sum, id) => sum + (ownHeat.get(id) ?? 0), 0);

  const intensity = sqrtNormalize(ownHeat);

  // Topic hubs: the rollup lands on the synthetic title dot — under the
  // main-node regime that dot exists for every populated topic, so every
  // member is a plain leaf there (own heat only); legacy blobs keep the
  // rollup on the first member.
  const topicHeat = new Map<string, number>();
  for (const topic of topics) topicHeat.set(topic.key, sumOf(topic.memberIds));
  const topicIntensity = sqrtNormalize(topicHeat);
  for (const topic of topics) {
    const value = topicIntensity.get(topic.key) ?? 0;
    intensity.set(`topic:${topic.key}`, value);
    const hasMainDot = mainNodesEnabled && topic.memberIds.length > 0;
    if (!hasMainDot && topic.memberIds.length > 0)
      intensity.set(topic.memberIds[0], value);
  }

  const communityIntensity = sqrtNormalize(
    new Map(
      communities.map((community) => [
        community.key,
        sumOf(community.memberIds),
      ]),
    ),
  );
  for (const [key, value] of communityIntensity) {
    intensity.set(communityNodeId(key), value);
  }

  const clusterIntensity = sqrtNormalize(
    new Map(clusters.map((cluster) => [cluster.key, sumOf(cluster.memberIds)])),
  );
  for (const [key, value] of clusterIntensity) {
    intensity.set(clusterNodeId(key), value);
  }

  return intensity;
}

/** sqrt(h / tier-max) per entry; an all-cold tier maps to all zeros. */
function sqrtNormalize(heat: ReadonlyMap<string, number>): Map<string, number> {
  const max = Math.max(0, ...heat.values());
  return new Map(
    [...heat.entries()].map(([key, value]) => [
      key,
      max > 0 ? Math.sqrt(value / max) : 0,
    ]),
  );
}
