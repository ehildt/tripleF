import { describe, expect, it } from 'vitest';

import { buildRootNode } from './build-root-node.helper';
import { ROOT_NODE_ID } from './root-node-id.constant';

describe('buildRootNode', () => {
  it('builds a synthetic root dot anchored at the origin', () => {
    const node = buildRootNode();

    expect(node.id).toBe(ROOT_NODE_ID);
    expect(node.isRoot).toBe(true);
    expect(node.label).toBe('0');
    expect(node.keys).toEqual([]);
  });
});
