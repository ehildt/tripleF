import { describe, expect, it } from 'vitest';

import type { RelaxedLayout } from '../MemoryConstellation.types';
import { buildOrbitCenters } from './build-orbit-centers.helper';

const layout = (): RelaxedLayout => ({
  topics: [
    {
      key: 'x',
      label: 'x',
      color: '#000',
      memberIds: ['a', 'b', 'c'],
    },
    {
      key: 'y',
      label: 'y',
      color: '#000',
      memberIds: ['d'],
    },
  ],
  clusters: [],
  positions: new Map([
    ['a', { x: 0, y: 0, z: 0 }],
    ['b', { x: 10, y: 0, z: 0 }],
    ['c', { x: 20, y: 0, z: 0 }],
    ['d', { x: 50, y: 0, z: 0 }],
  ]),
});

describe('buildOrbitCenters', () => {
  it('maps every non-hub member to its hub position', () => {
    const centers = buildOrbitCenters(layout());

    expect(centers.size).toBe(2);
    expect(centers.get('b')?.center).toEqual({ x: 0, y: 0, z: 0 });
    expect(centers.get('c')?.center).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('excludes hubs and single-member topics', () => {
    const centers = buildOrbitCenters(layout());

    expect(centers.has('a')).toBe(false);
    expect(centers.has('d')).toBe(false);
  });

  it('assigns a distinct phase per leaf', () => {
    const centers = buildOrbitCenters(layout());

    expect(centers.get('b')?.phase).not.toBe(centers.get('c')?.phase);
  });
});
