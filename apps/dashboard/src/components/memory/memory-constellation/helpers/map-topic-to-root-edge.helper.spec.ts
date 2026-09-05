import { describe, expect, it } from 'vitest';

import { mapTopicToRootEdge } from './map-topic-to-root-edge.helper';

describe('mapTopicToRootEdge', () => {
  it('builds a root edge from a topic', () => {
    const edge = mapTopicToRootEdge(
      { key: 'c1', memberIds: ['n1'] },
      new Set(),
    );
    expect(edge.kind).toBe('root');
    expect(edge.target).toBe('root:zero');
    expect(edge.source).toBe('n1');
  });
});
