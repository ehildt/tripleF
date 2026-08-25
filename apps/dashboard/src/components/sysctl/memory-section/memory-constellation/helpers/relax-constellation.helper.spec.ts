import { describe, expect, it } from 'vitest';

import type {
  ConstellationEdge,
  ConstellationNode,
  ConstellationPosition,
} from '../MemoryConstellation.types';
import { relaxConstellation } from './relax-constellation.helper';

const makeNode = (
  id: string,
  clusterKey: string,
  extra: Partial<ConstellationNode> = {},
): ConstellationNode => ({
  id,
  label: id,
  clusterKey,
  text: id,
  keys: [clusterKey],
  ...extra,
});

const makeEdge = (
  source: string,
  target: string,
  kind: 'intra' | 'inter',
  score?: number,
): ConstellationEdge => ({ source, target, kind, score });

const pos = (x: number, y: number, z: number): ConstellationPosition => ({
  x,
  y,
  z,
});

const distance = (a: ConstellationPosition, b: ConstellationPosition): number =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

describe('relaxConstellation', () => {
  it('pulls linked nodes together', () => {
    const nodes = [makeNode('a', 'x'), makeNode('b', 'x')];
    const edges = [makeEdge('a', 'b', 'intra')];
    const seed = new Map([
      ['a', pos(0, 0, 0)],
      ['b', pos(200, 0, 0)],
    ]);

    const positions = relaxConstellation(nodes, edges, seed);

    expect(distance(positions.get('a')!, positions.get('b')!)).toBeLessThan(
      100,
    );
  });

  it('keeps anchored nodes pinned at the origin', () => {
    const nodes = [
      makeNode('hub', 'profile', { anchorToOrigin: true }),
      makeNode('a', 'x'),
    ];
    const edges = [makeEdge('hub', 'a', 'intra')];
    const seed = new Map([
      ['hub', pos(0, 0, 0)],
      ['a', pos(100, 0, 0)],
    ]);

    const positions = relaxConstellation(nodes, edges, seed);

    expect(positions.get('hub')).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('keeps category dots pinned at their seed position', () => {
    const nodes = [
      makeNode('cluster:x', 'x', { isCategory: true }),
      makeNode('a', 'y'),
    ];
    const edges: ConstellationEdge[] = [];
    const seed = new Map([
      ['cluster:x', pos(50, 0, 0)],
      ['a', pos(-50, 0, 0)],
    ]);

    const positions = relaxConstellation(nodes, edges, seed);

    expect(positions.get('cluster:x')).toEqual({ x: 50, y: 0, z: 0 });
  });

  it('is deterministic for the same input', () => {
    const nodes = [makeNode('a', 'x'), makeNode('b', 'x'), makeNode('c', 'y')];
    const edges = [
      makeEdge('a', 'b', 'intra'),
      makeEdge('b', 'c', 'inter', 0.5),
    ];
    const seed = new Map([
      ['a', pos(0, 0, 0)],
      ['b', pos(40, 0, 0)],
      ['c', pos(80, 0, 0)],
    ]);

    const first = relaxConstellation(nodes, edges, seed);
    const second = relaxConstellation(nodes, edges, seed);

    expect([...first.entries()]).toEqual([...second.entries()]);
  });
});
