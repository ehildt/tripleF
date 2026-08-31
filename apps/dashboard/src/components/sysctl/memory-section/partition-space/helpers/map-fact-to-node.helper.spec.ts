import { describe, expect, it } from 'vitest';

import { mapFactToNode } from './map-fact-to-node.helper';

describe('mapFactToNode', () => {
  it('maps a fact to a constellation node', () => {
    const node = mapFactToNode({
      id: 'f1',
      text: 'likes games',
      tags: ['games'],
      role: 'user',
      category: 'Games',
      createdAt: '2025-01-01',
    });
    expect(node.id).toBe('f1');
    expect(node.clusterKey).toBe('games');
    expect(node.communityKey).toBe('Games');
    expect(node.meta).toHaveLength(2);
  });

  it('falls back to the untagged cluster', () => {
    expect(mapFactToNode({ id: 'f1', text: 'hello' }).clusterKey).toBe(
      'untagged',
    );
  });
});
