import { describe, expect, it } from 'vitest';

import type {
  ConstellationCluster,
  ConstellationTopic,
} from '../MemoryConstellation.types';
import { buildRootEdges } from './build-root-edges.helper';
import { ROOT_NODE_ID } from './root-node-id.constant';

const topic = (key: string, memberIds: string[]): ConstellationTopic => ({
  key,
  label: key,
  color: '#8b5cf6',
  memberIds,
});

const cluster = (
  key: string,
  memberTopicKeys: string[],
): ConstellationCluster => ({
  key,
  label: key,
  color: '#f97316',
  memberTopicKeys,
  memberIds: [],
});

describe('buildRootEdges', () => {
  it('connects every category hub to the ZERO root', () => {
    const edges = buildRootEdges(
      [topic('nte', ['a']), topic('dog', ['b'])],
      [cluster('games', ['nte']), cluster('pets', ['dog'])],
      new Set(),
    );

    expect(edges).toEqual([
      { source: 'cluster:games', target: ROOT_NODE_ID, kind: 'root' },
      { source: 'cluster:pets', target: ROOT_NODE_ID, kind: 'root' },
    ]);
  });

  it('connects cluster-less topics directly to the root alongside category hubs', () => {
    const edges = buildRootEdges(
      [topic('nte', ['a']), topic('bridges', ['b1', 'b2'])],
      [cluster('games', ['nte'])],
      new Set(),
    );

    expect(edges).toEqual([
      { source: 'cluster:games', target: ROOT_NODE_ID, kind: 'root' },
      { source: 'b1', target: ROOT_NODE_ID, kind: 'root' },
    ]);
  });

  it('connects each main dot directly to the root when there are no categories', () => {
    const edges = buildRootEdges(
      [topic('name', ['a']), topic('likes', ['b', 'c'])],
      [],
      new Set(),
    );

    expect(edges).toEqual([
      { source: 'a', target: ROOT_NODE_ID, kind: 'root' },
      { source: 'b', target: ROOT_NODE_ID, kind: 'root' },
    ]);
  });

  it('uses the member for a collapsed single-member topic', () => {
    const edges = buildRootEdges([topic('name', ['a'])], [], new Set(['name']));

    // Single-member topics never collapse, so the edge anchors to the member.
    expect(edges).toEqual([
      { source: 'a', target: ROOT_NODE_ID, kind: 'root' },
    ]);
  });

  it('uses the category dot for a collapsed multi-member topic', () => {
    const edges = buildRootEdges(
      [topic('name', ['a', 'b'])],
      [],
      new Set(['name']),
    );

    expect(edges).toEqual([
      { source: 'topic:name', target: ROOT_NODE_ID, kind: 'root' },
    ]);
  });

  it('emits nothing when there are no categories and no topics', () => {
    expect(buildRootEdges([], [], new Set())).toEqual([]);
  });
});
