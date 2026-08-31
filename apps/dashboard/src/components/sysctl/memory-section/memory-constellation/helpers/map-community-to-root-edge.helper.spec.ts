import { describe, expect, it } from 'vitest';

import { mapCommunityToRootEdge } from './map-community-to-root-edge.helper';

describe('mapCommunityToRootEdge', () => {
  it('builds a root edge from a community', () => {
    const edge = mapCommunityToRootEdge({
      key: 'games',
      memberClusterKeys: [],
    });
    expect(edge.kind).toBe('root');
    expect(edge.target).toBe('root:zero');
    expect(edge.source).toBeTruthy();
  });
});
