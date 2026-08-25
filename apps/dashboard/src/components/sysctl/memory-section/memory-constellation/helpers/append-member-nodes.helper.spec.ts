import { describe, expect, it } from 'vitest';

import type { ConstellationNode } from '../MemoryConstellation.types';
import { appendMemberNodes } from './append-member-nodes.helper';

const makeNode = (id: string): ConstellationNode => ({
  id,
  label: id,
  clusterKey: 'x',
  text: id,
  keys: ['x'],
});

describe('appendMemberNodes', () => {
  it('appends every member at its relaxed position with its index', () => {
    const acc = {
      visibleNodes: [],
      positions: new Map(),
      nodeIndex: new Map(),
    };
    appendMemberNodes(
      { key: 'x', label: 'x', color: '#000', memberIds: ['a', 'b'] },
      new Map([
        ['a', { x: 0, y: 0, z: 0 }],
        ['b', { x: 10, y: 0, z: 0 }],
      ]),
      new Map([
        ['a', makeNode('a')],
        ['b', makeNode('b')],
      ]),
      acc,
    );

    expect(acc.visibleNodes.map((n) => n.id)).toEqual(['a', 'b']);
    expect(acc.nodeIndex.get('b')).toBe(1);
    expect(acc.positions.get('a')).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('hides leaves further than 80 units from their main dot', () => {
    const acc = {
      visibleNodes: [],
      positions: new Map(),
      nodeIndex: new Map(),
    };
    appendMemberNodes(
      { key: 'x', label: 'x', color: '#000', memberIds: ['a', 'far'] },
      new Map([
        ['a', { x: 0, y: 0, z: 0 }],
        ['far', { x: 200, y: 0, z: 0 }],
      ]),
      new Map([
        ['a', makeNode('a')],
        ['far', makeNode('far')],
      ]),
      acc,
    );

    expect(acc.visibleNodes.map((n) => n.id)).toEqual(['a']);
  });

  it('skips members without a node or position', () => {
    const acc = {
      visibleNodes: [],
      positions: new Map(),
      nodeIndex: new Map(),
    };
    appendMemberNodes(
      { key: 'x', label: 'x', color: '#000', memberIds: ['a', 'ghost'] },
      new Map([['a', { x: 0, y: 0, z: 0 }]]),
      new Map([['a', makeNode('a')]]),
      acc,
    );

    expect(acc.visibleNodes.map((n) => n.id)).toEqual(['a']);
  });
});
