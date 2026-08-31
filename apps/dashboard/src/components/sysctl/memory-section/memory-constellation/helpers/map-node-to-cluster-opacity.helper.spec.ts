import { describe, expect, it } from 'vitest';

import { mapNodeToClusterOpacity } from './map-node-to-cluster-opacity.helper';

describe('mapNodeToClusterOpacity', () => {
  it('builds a cluster-opacity input from a node and its projected point', () => {
    expect(
      mapNodeToClusterOpacity({ id: 'n1', clusterKey: 'c1' } as never, 1, [
        { x: 0, y: 0, scale: 1 },
        { x: 5, y: 6, scale: 0.5 },
      ]),
    ).toEqual({ clusterKey: 'c1', x: 5, y: 6 });
  });
});
