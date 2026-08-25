import { describe, expect, it } from 'vitest';

import { hitTestNode } from './hit-test-node.helper';

describe('hitTestNode', () => {
  it('returns the nearest node within the 30px reach', () => {
    const projected = [
      { x: 10, y: 10, scale: 1 },
      { x: 20, y: 10, scale: 1 },
    ];

    expect(hitTestNode(19, 10, projected)).toBe(1);
  });

  it('returns -1 when every node is out of reach', () => {
    const projected = [{ x: 100, y: 100, scale: 1 }];

    expect(hitTestNode(0, 0, projected)).toBe(-1);
  });

  it('returns -1 for no nodes', () => {
    expect(hitTestNode(0, 0, [])).toBe(-1);
  });
});
