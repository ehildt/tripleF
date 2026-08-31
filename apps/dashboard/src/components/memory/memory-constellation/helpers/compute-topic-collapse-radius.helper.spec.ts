import { describe, expect, it } from 'vitest';

import { computeTopicCollapseRadius } from './compute-topic-collapse-radius.helper';

describe('computeTopicCollapseRadius', () => {
  it('returns the furthest member distance from the centroid', () => {
    const radius = computeTopicCollapseRadius(
      {
        topics: [
          { key: 'x', label: 'x', color: '#000', memberIds: ['a', 'b'] },
        ],
        positions: new Map([
          ['a', { x: 0, y: 0, z: 0 }],
          ['b', { x: 10, y: 0, z: 0 }],
        ]),
      },
      'x',
    );

    // Members at 0 and 10 from the centroid (5, 0, 0).
    expect(radius).toBe(5);
  });

  it('returns 0 for an unknown topic', () => {
    expect(
      computeTopicCollapseRadius({ topics: [], positions: new Map() }, 'ghost'),
    ).toBe(0);
  });
});
