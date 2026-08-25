import { describe, expect, it } from 'vitest';

import type { VisibleAccumulator } from '../MemoryConstellation.types';
import { appendRootNode } from './append-root-node.helper';
import { ROOT_NODE_ID } from './root-node-id.constant';

describe('appendRootNode', () => {
  it('appends the root dot at the origin with an index entry', () => {
    const acc: VisibleAccumulator = {
      visibleNodes: [],
      positions: new Map(),
      nodeIndex: new Map(),
    };

    appendRootNode(acc);

    expect(acc.visibleNodes).toHaveLength(1);
    expect(acc.visibleNodes[0]?.id).toBe(ROOT_NODE_ID);
    expect(acc.positions.get(ROOT_NODE_ID)).toEqual({ x: 0, y: 0, z: 0 });
    expect(acc.nodeIndex.get(ROOT_NODE_ID)).toBe(0);
  });
});
