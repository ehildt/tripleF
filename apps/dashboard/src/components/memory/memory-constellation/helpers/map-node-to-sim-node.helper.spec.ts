import { describe, expect, it } from 'vitest';

import { mapNodeToSimNode } from './map-node-to-sim-node.helper';

describe('mapNodeToSimNode', () => {
  it('builds a simulation node from a seeded node', () => {
    expect(
      mapNodeToSimNode(
        {
          id: 'n1',
          label: 'L',
          topicKey: 'c',
          text: 'T',
          anchorToOrigin: true,
        },
        new Map([['n1', { x: 1, y: 2, z: 3 }]]),
      ),
    ).toEqual({
      id: 'n1',
      x: 1,
      y: 2,
      z: 3,
      fx: 1,
      fy: 2,
      fz: 3,
    });
  });

  it('falls back to the origin for unseeded nodes', () => {
    expect(
      mapNodeToSimNode(
        { id: 'n1', label: 'L', topicKey: 'c', text: 'T' },
        new Map(),
      ),
    ).toMatchObject({
      x: 0,
      y: 0,
      z: 0,
      fx: null,
    });
  });
});
