import { describe, expect, it } from 'vitest';

import type {
  ConstellationCluster,
  ConstellationCommunity,
} from '../MemoryConstellation.types';
import { buildRootEdges } from './build-root-edges.helper';
import { ROOT_NODE_ID } from './root-node-id.constant';

const cluster = (key: string, memberIds: string[]): ConstellationCluster => ({
  key,
  label: key,
  color: '#8b5cf6',
  memberIds,
});

const community = (
  key: string,
  memberClusterKeys: string[],
): ConstellationCommunity => ({
  key,
  label: key,
  color: '#f97316',
  memberClusterKeys,
  memberIds: [],
});

describe('buildRootEdges', () => {
  it('connects every category hub to the ZERO root', () => {
    const edges = buildRootEdges(
      [cluster('nte', ['a']), cluster('dog', ['b'])],
      [community('games', ['nte']), community('pets', ['dog'])],
      new Set(),
    );

    expect(edges).toEqual([
      { source: 'community:games', target: ROOT_NODE_ID, kind: 'root' },
      { source: 'community:pets', target: ROOT_NODE_ID, kind: 'root' },
    ]);
  });

  it('connects each main dot directly to the root when there are no categories', () => {
    const edges = buildRootEdges(
      [cluster('name', ['a']), cluster('likes', ['b', 'c'])],
      [],
      new Set(),
    );

    expect(edges).toEqual([
      { source: 'a', target: ROOT_NODE_ID, kind: 'root' },
      { source: 'b', target: ROOT_NODE_ID, kind: 'root' },
    ]);
  });

  it('uses the member for a collapsed single-member cluster', () => {
    const edges = buildRootEdges(
      [cluster('name', ['a'])],
      [],
      new Set(['name']),
    );

    // Single-member clusters never collapse, so the edge anchors to the member.
    expect(edges).toEqual([
      { source: 'a', target: ROOT_NODE_ID, kind: 'root' },
    ]);
  });

  it('uses the category dot for a collapsed multi-member cluster', () => {
    const edges = buildRootEdges(
      [cluster('name', ['a', 'b'])],
      [],
      new Set(['name']),
    );

    expect(edges).toEqual([
      { source: 'cluster:name', target: ROOT_NODE_ID, kind: 'root' },
    ]);
  });

  it('emits nothing when there are no categories and no clusters', () => {
    expect(buildRootEdges([], [], new Set())).toEqual([]);
  });
});
