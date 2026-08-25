import { describe, expect, it } from 'vitest';

import type { RelaxedLayout } from '../MemoryConstellation.types';
import {
  computeOverviewRadius,
  MIN_OVERVIEW_RADIUS,
} from './compute-overview-radius.helper';

const layout = (): RelaxedLayout => ({
  clusters: [
    {
      key: 'x',
      label: 'x',
      color: '#000',
      memberIds: ['a', 'b'],
    },
  ],
  communities: [
    {
      key: 'games',
      label: 'games',
      color: '#f97316',
      memberClusterKeys: ['x'],
      memberIds: ['a', 'b'],
    },
  ],
  positions: new Map([
    ['a', { x: 0, y: 0, z: 0 }],
    ['b', { x: 30, y: 40, z: 0 }],
    ['community:games', { x: 200, y: 0, z: 0 }],
  ]),
});

describe('computeOverviewRadius', () => {
  it('returns the furthest centroid / community hub distance from the origin', () => {
    // Cluster centroid = (15, 20, 0) → distance 25; community hub = 200.
    expect(computeOverviewRadius(layout())).toBeCloseTo(200);
  });

  it('floors an empty layout at MIN_OVERVIEW_RADIUS', () => {
    expect(
      computeOverviewRadius({
        clusters: [],
        communities: [],
        positions: new Map(),
      }),
    ).toBe(MIN_OVERVIEW_RADIUS);
  });

  it('floors a sparse layout whose furthest distance is below MIN_OVERVIEW_RADIUS', () => {
    // Single cluster centroid = (15, 20, 0) → distance 25 < floor.
    expect(
      computeOverviewRadius({
        clusters: [
          {
            key: 'x',
            label: 'x',
            color: '#000',
            memberIds: ['a', 'b'],
          },
        ],
        communities: [],
        positions: new Map([
          ['a', { x: 0, y: 0, z: 0 }],
          ['b', { x: 30, y: 40, z: 0 }],
        ]),
      }),
    ).toBe(MIN_OVERVIEW_RADIUS);
  });
});
