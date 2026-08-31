import { describe, expect, it } from 'vitest';

import { mapClusterToRootEdge } from './map-cluster-to-root-edge.helper';

describe('mapClusterToRootEdge', () => {
  it('builds a root edge from a cluster', () => {
    const edge = mapClusterToRootEdge({
      key: 'games',
      memberTopicKeys: [],
    });
    expect(edge.kind).toBe('root');
    expect(edge.target).toBe('root:zero');
    expect(edge.source).toBeTruthy();
  });
});
