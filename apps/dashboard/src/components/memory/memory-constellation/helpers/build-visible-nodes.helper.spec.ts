import { describe, expect, it } from 'vitest';

import type { ConstellationNode } from '../MemoryConstellation.types';
import { buildVisibleNodes } from './build-visible-nodes.helper';

const makeNode = (id: string, topicKey: string): ConstellationNode => ({
  id,
  label: id,
  topicKey,
  text: id,
  keys: [topicKey],
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
});
