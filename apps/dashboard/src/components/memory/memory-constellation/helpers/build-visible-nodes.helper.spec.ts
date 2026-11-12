import { describe, expect, it } from 'vitest';

import type { ConstellationNode } from '../MemoryConstellation.types';
import { buildVisibleNodes } from './build-visible-nodes.helper';

const makeNode = (
  id: string,
  topicKey: string,
  node?: string,
): ConstellationNode => ({
  id,
  label: id,
  topicKey,
  text: id,
  keys: [topicKey],
  node,
});

describe('buildVisibleNodes', () => {
  it('expands topics not in collapsedKeys', () => {
    const nodes = [makeNode('a', 'x'), makeNode('b', 'x')];
    const acc = buildVisibleNodes(
      [{ key: 'x', label: 'x', color: '#000', memberIds: ['a', 'b'] }],
      new Map([
        ['a', { x: 0, y: 0, z: 0 }],
        ['b', { x: 10, y: 0, z: 0 }],
      ]),
      new Map(nodes.map((n) => [n.id, n])),
      new Set(),
    );

    expect(acc.visibleNodes.map((n) => n.id)).toEqual(['a', 'b']);
  });

  it('replaces a collapsed topic with its synthetic category dot', () => {
    const nodes = [makeNode('a', 'x'), makeNode('b', 'x')];
    const acc = buildVisibleNodes(
      [{ key: 'x', label: 'x', color: '#000', memberIds: ['a', 'b'] }],
      new Map([
        ['a', { x: 0, y: 0, z: 0 }],
        ['b', { x: 10, y: 0, z: 0 }],
      ]),
      new Map(nodes.map((n) => [n.id, n])),
      new Set(['x']),
    );

    expect(acc.visibleNodes).toHaveLength(1);
    expect(acc.visibleNodes[0].id).toBe('topic:x');
    expect(acc.visibleNodes[0].isTopic).toBe(true);
  });

  it('renders a single-member topic directly even when collapsed', () => {
    const nodes = [makeNode('a', 'x')];
    const acc = buildVisibleNodes(
      [{ key: 'x', label: 'x', color: '#000', memberIds: ['a'] }],
      new Map([['a', { x: 0, y: 0, z: 0 }]]),
      new Map(nodes.map((n) => [n.id, n])),
      new Set(['x']),
    );

    expect(acc.visibleNodes.map((n) => n.id)).toEqual(['a']);
    expect(acc.visibleNodes[0].isTopic).toBeUndefined();
  });

  it('renders a populated single-leaf hub and node in the main-node regime', () => {
    const nodes = [makeNode('a', 'x', 'status')];
    const acc = buildVisibleNodes(
      [{ key: 'x', label: 'x', color: '#000', memberIds: ['a'] }],
      new Map([['a', { x: 0, y: 0, z: 0 }]]),
      new Map(nodes.map((n) => [n.id, n])),
      new Set(),
      [],
      new Map(),
    );

    expect(acc.visibleNodes.map((n) => n.id)).toEqual([
      'topic:x',
      'node:x:status',
      'a',
    ]);
  });

  it('keeps the synthetic main dot beside the expanded members under the main-node regime', () => {
    const nodes = [makeNode('a', 'x'), makeNode('b', 'x')];
    const acc = buildVisibleNodes(
      [{ key: 'x', label: 'x', color: '#000', memberIds: ['a', 'b'] }],
      new Map([
        ['a', { x: 0, y: 0, z: 0 }],
        ['b', { x: 10, y: 0, z: 0 }],
      ]),
      new Map(nodes.map((n) => [n.id, n])),
      new Set(),
      [],
      new Map(),
    );

    // Main dot first (title tier), then the leafs.
    expect(acc.visibleNodes.map((n) => n.id)).toEqual(['topic:x', 'a', 'b']);
    expect(acc.visibleNodes[0].isTopic).toBe(true);
    expect(acc.positions.get('topic:x')).toEqual({ x: 5, y: 0, z: 0 });
  });

  it('collapses to the main dot alone under the main-node regime', () => {
    const nodes = [makeNode('a', 'x'), makeNode('b', 'x')];
    const acc = buildVisibleNodes(
      [{ key: 'x', label: 'x', color: '#000', memberIds: ['a', 'b'] }],
      new Map([
        ['a', { x: 0, y: 0, z: 0 }],
        ['b', { x: 10, y: 0, z: 0 }],
      ]),
      new Map(nodes.map((n) => [n.id, n])),
      new Set(['x']),
      [],
      new Map(),
    );

    expect(acc.visibleNodes.map((n) => n.id)).toEqual(['topic:x']);
  });

  it('renders one populated node tier for a single-aspect hub', () => {
    const nodes = [
      makeNode('a', 'x', 'base building'),
      makeNode('b', 'x', 'base building'),
    ];
    const acc = buildVisibleNodes(
      [{ key: 'x', label: 'x', color: '#000', memberIds: ['a', 'b'] }],
      new Map([
        ['a', { x: 0, y: 0, z: 0 }],
        ['b', { x: 10, y: 0, z: 0 }],
      ]),
      new Map(nodes.map((n) => [n.id, n])),
      new Set(),
      [],
      new Map(),
    );

    expect(acc.visibleNodes.map((n) => n.id)).toEqual([
      'topic:x',
      'node:x:base building',
      'a',
      'b',
    ]);
    expect(acc.visibleNodes[1].memberCount).toBe(2);
    expect(acc.positions.get('node:x:base building')).not.toEqual(
      acc.positions.get('topic:x'),
    );
  });

  it('does not create a node tier for leaves hidden by the distance filter', () => {
    const nodes = [
      makeNode('a', 'x', 'near'),
      makeNode('b', 'x', 'near'),
      makeNode('c', 'x', 'far'),
    ];
    const acc = buildVisibleNodes(
      [{ key: 'x', label: 'x', color: '#000', memberIds: ['a', 'b', 'c'] }],
      new Map([
        ['a', { x: 0, y: 0, z: 0 }],
        ['b', { x: 10, y: 0, z: 0 }],
        ['c', { x: 200, y: 0, z: 0 }],
      ]),
      new Map(nodes.map((n) => [n.id, n])),
      new Set(),
      [],
      new Map(),
    );

    expect(acc.visibleNodes.map((n) => n.id)).toEqual([
      'topic:x',
      'node:x:near',
      'a',
      'b',
    ]);
    expect(acc.nodeIndex.has('node:x:far')).toBe(false);
  });
});
