import { describe, expect, it } from 'vitest';

import type { ConstellationNode } from '../MemoryConstellation.types';
import { buildCommunities } from './build-communities.helper';

const makeNode = (
  id: string,
  clusterKey: string,
  communityKey?: string,
): ConstellationNode => ({
  id,
  label: id,
  clusterKey,
  text: id,
  keys: [clusterKey],
  communityKey,
});

const clusters = (keys: string[]) =>
  keys.map((key, i) => ({
    key,
    label: key,
    color: `#00${i}`,
    memberIds: [`${key}-a`],
  }));

describe('buildCommunities', () => {
  it('groups clusters whose members share a communityKey', () => {
    const nodes = [
      makeNode('nte-a', 'nte', 'games'),
      makeNode('wuthering waves-a', 'wuthering waves', 'games'),
      makeNode('dog-a', 'dog', 'pets'),
    ];
    const communities = buildCommunities(
      nodes,
      clusters(['nte', 'wuthering waves', 'dog']),
    );

    expect(communities).toHaveLength(2);
    expect(communities[0]).toMatchObject({
      key: 'games',
      label: 'games',
      memberClusterKeys: ['nte', 'wuthering waves'],
      memberIds: ['nte-a', 'wuthering waves-a'],
    });
    expect(communities[1]).toMatchObject({
      key: 'pets',
      memberClusterKeys: ['dog'],
    });
  });

  it('keeps communities backed by a single cluster (so they reach the root)', () => {
    const nodes = [
      makeNode('dog-a', 'dog', 'pets'),
      makeNode('dog health-a', 'dog health'),
    ];
    const communities = buildCommunities(
      nodes,
      clusters(['dog', 'dog health']),
    );

    expect(communities).toHaveLength(1);
    expect(communities[0]).toMatchObject({
      key: 'pets',
      memberClusterKeys: ['dog'],
    });
  });

  it('ignores blank communityKeys', () => {
    const nodes = [makeNode('a', 'x', '  '), makeNode('b', 'y', '')];
    expect(buildCommunities(nodes, clusters(['x', 'y']))).toEqual([]);
  });

  it('assigns a stable palette color per community', () => {
    const nodes = [
      makeNode('a-a', 'a', 'games'),
      makeNode('b-a', 'b', 'games'),
      makeNode('c-a', 'c', 'pets'),
      makeNode('d-a', 'd', 'pets'),
    ];
    const communities = buildCommunities(nodes, clusters(['a', 'b', 'c', 'd']));

    expect(communities).toHaveLength(2);
    expect(communities[0]?.color).not.toBe(communities[1]?.color);
  });
});
