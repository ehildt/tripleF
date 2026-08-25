import { describe, expect, it } from 'vitest';

import type { ConstellationNode } from '../MemoryConstellation.types';
import { buildLinkCounts } from './build-link-counts.helper';

const nodes: ConstellationNode[] = [
  { id: 'a', label: 'a', clusterKey: 'x', text: 'a', keys: ['x'] },
  { id: 'b', label: 'b', clusterKey: 'x', text: 'b', keys: ['x'] },
];

describe('buildLinkCounts', () => {
  it('counts the edge degree of every visible endpoint', () => {
    const counts = buildLinkCounts(
      [
        { a: 0, b: 1, kind: 'intra', alpha: 0.5 },
        { a: 1, b: 0, kind: 'intra', alpha: 0.5 },
      ],
      nodes,
    );

    expect(counts.get('a')).toBe(2);
    expect(counts.get('b')).toBe(2);
  });

  it('returns an empty map for no edges', () => {
    expect(buildLinkCounts([], nodes).size).toBe(0);
  });
});
