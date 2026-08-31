import { describe, expect, it } from 'vitest';

import { mapNodeToProjected } from './map-node-to-projected.helper';

const node = { id: 'n1', clusterKey: 'c1' } as never;

describe('mapNodeToProjected', () => {
  it('falls back to the view center when the node has no position', () => {
    const result = mapNodeToProjected(
      node,
      new Map(),
      new Map(),
      new Map(),
      0,
      0,
      100,
      50,
      0,
      0,
      100,
      1,
    );
    expect(result).toEqual({ x: 100, y: 50, scale: 1 });
  });

  it('projects a positioned node without orbit', () => {
    const positions = new Map([['n1', { x: 1, y: 2, z: 3 }]]);
    const result = mapNodeToProjected(
      node,
      positions,
      new Map(),
      new Map(),
      0,
      0,
      100,
      50,
      0,
      0,
      100,
      1,
    );
    expect(result).toHaveProperty('x');
    expect(result).toHaveProperty('y');
    expect(result).toHaveProperty('scale');
  });
});
