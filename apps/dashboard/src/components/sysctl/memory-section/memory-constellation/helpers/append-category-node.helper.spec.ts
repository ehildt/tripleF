import { describe, expect, it } from 'vitest';

import type { VisibleAccumulator } from '../MemoryConstellation.types';
import { appendCategoryNode } from './append-category-node.helper';

const makeAcc = (): VisibleAccumulator => ({
  visibleNodes: [],
  positions: new Map(),
  nodeIndex: new Map(),
});

describe('appendCategoryNode', () => {
  it('appends a synthetic category dot with its member count', () => {
    const acc = makeAcc();
    appendCategoryNode(
      { key: 'work', label: 'work', color: '#000', memberIds: ['a', 'b'] },
      new Map([
        ['a', { x: 0, y: 0, z: 0 }],
        ['b', { x: 4, y: 0, z: 0 }],
      ]),
      acc,
    );

    expect(acc.visibleNodes).toHaveLength(1);
    expect(acc.visibleNodes[0]).toMatchObject({
      id: 'cluster:work',
      label: 'work',
      clusterKey: 'work',
      isCategory: true,
      memberCount: 2,
    });
    expect(acc.nodeIndex.get('cluster:work')).toBe(0);
  });

  it('places the dot at the members relaxed centroid', () => {
    const acc = makeAcc();
    appendCategoryNode(
      { key: 'work', label: 'work', color: '#000', memberIds: ['a', 'b'] },
      new Map([
        ['a', { x: 0, y: 0, z: 0 }],
        ['b', { x: 4, y: 0, z: 0 }],
      ]),
      acc,
    );

    expect(acc.positions.get('cluster:work')).toEqual({ x: 2, y: 0, z: 0 });
  });

  it('omits the position when no member is relaxed', () => {
    const acc = makeAcc();
    appendCategoryNode(
      { key: 'work', label: 'work', color: '#000', memberIds: ['a'] },
      new Map(),
      acc,
    );

    expect(acc.positions.has('cluster:work')).toBe(false);
  });
});
