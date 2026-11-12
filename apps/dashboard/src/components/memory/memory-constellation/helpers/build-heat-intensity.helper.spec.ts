import { describe, expect, it } from 'vitest';

import type {
  ConstellationCluster,
  ConstellationCommunity,
  ConstellationNode,
  ConstellationTopic,
} from '../MemoryConstellation.types';
import { buildHeatIntensity } from './build-heat-intensity.helper';

function makeNode(id: string, heatAmount?: number): ConstellationNode {
  return {
    id,
    label: id,
    topicKey: `topic-${id}`,
    text: id,
    keys: [],
    heatAmount,
  };
}

function makeTopic(key: string, memberIds: string[]): ConstellationTopic {
  return { key, label: key, color: '#fff', memberIds };
}

function makeCommunity(
  key: string,
  memberIds: string[],
): ConstellationCommunity {
  return {
    key,
    label: key,
    color: '#fff',
    clusterKey: 'cluster-x',
    memberTopicKeys: [],
    memberIds,
  };
}

function makeCluster(key: string, memberIds: string[]): ConstellationCluster {
  return {
    key,
    label: key,
    color: '#fff',
    memberTopicKeys: [],
    memberCommunityKeys: [],
    memberIds,
  };
}

describe('buildHeatIntensity', () => {
  it('is all-zero when no node carries heat', () => {
    const nodes = [makeNode('a'), makeNode('b')];
    const intensity = buildHeatIntensity(
      nodes,
      [makeTopic('t', ['a', 'b'])],
      [],
      [],
    );
    expect(intensity.get('a')).toBe(0);
    expect(intensity.get('b')).toBe(0);
    expect(intensity.get('topic:t')).toBe(0);
  });

  it('normalizes leaves against the hottest leaf with sqrt dampening', () => {
    const nodes = [makeNode('hot', 4), makeNode('warm', 1)];
    const intensity = buildHeatIntensity(nodes, [], [], []);
    expect(intensity.get('hot')).toBe(1);
    expect(intensity.get('warm')).toBe(0.5);
  });

  it('lands the topic rollup on both the collapsed dot and the expanded hub', () => {
    const nodes = [makeNode('a', 2), makeNode('b', 2)];
    const intensity = buildHeatIntensity(
      nodes,
      [makeTopic('t', ['a', 'b'])],
      [],
      [],
    );
    // Single topic → the tier max is its own sum → full warmth.
    expect(intensity.get('topic:t')).toBe(1);
    // The expanded topic hub (first member) shows the rollup, not its own heat.
    expect(intensity.get('a')).toBe(1);
    // The non-hub leaf keeps its own normalized heat (2 / leaf-max 2 → 1).
    expect(intensity.get('b')).toBe(1);
  });

  it('lands the rollup only on the synthetic title dot under the main-node regime', () => {
    const nodes = [makeNode('a', 2), makeNode('b', 2), makeNode('c', 2)];
    const topics = [makeTopic('t', ['a', 'b']), makeTopic('s', ['c'])];
    const intensity = buildHeatIntensity(nodes, topics, [], [], true);

    // Multi-member blob: the synthetic dot carries the rollup (tier max), the
    // members keep the leaf scale (own heat → 1).
    expect(intensity.get('topic:t')).toBe(1);
    expect(intensity.get('a')).toBe(1);
    expect(intensity.get('b')).toBe(1);
    // Single-member topic: the synthetic hub carries the rollup while the
    // member keeps its own leaf-scale heat.
    expect(intensity.get('topic:s')).toBeCloseTo(Math.sqrt(0.5));
    expect(intensity.get('c')).toBe(1);
  });

  it('normalizes hub rollups within their own tier', () => {
    const nodes = [
      makeNode('a', 4),
      makeNode('b', 0),
      makeNode('c', 1),
      makeNode('d', 0),
    ];
    const topics = [
      makeTopic('big', ['a', 'b']),
      makeTopic('small', ['c', 'd']),
    ];
    const intensity = buildHeatIntensity(nodes, topics, [], []);
    // Topic sums: big = 4 (tier max), small = 1 → sqrt(1/4).
    expect(intensity.get('topic:big')).toBe(1);
    expect(intensity.get('topic:small')).toBeCloseTo(0.5);
    // Leaf scale is untouched by the rollups: hottest leaf stays 1.
    expect(intensity.get('c')).toBeCloseTo(0.5);
  });

  it('aggregates community and cluster rollups keyed by their synthetic ids', () => {
    const nodes = [
      makeNode('a', 4),
      makeNode('b', 4),
      makeNode('c', 2),
      makeNode('d', 0),
    ];
    const topics = [makeTopic('t', ['a', 'b', 'c', 'd'])];
    const communities = [makeCommunity('com', ['a', 'b'])];
    const clusters = [makeCluster('clu', ['a', 'b', 'c', 'd'])];
    const intensity = buildHeatIntensity(nodes, topics, communities, clusters);
    expect(intensity.get('community:com')).toBe(1);
    expect(intensity.get('cluster:clu')).toBe(1);
    // The hottest leaf stays the leaf tier's own reference.
    expect(intensity.get('c')).toBeCloseTo(Math.sqrt(0.5));
    expect(intensity.get('d')).toBe(0);
  });
});
