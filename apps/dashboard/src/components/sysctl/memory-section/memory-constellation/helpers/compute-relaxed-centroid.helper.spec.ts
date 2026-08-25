import { describe, expect, it } from 'vitest';

import { computeRelaxedCentroid } from './compute-relaxed-centroid.helper';

const cluster = {
  key: 'work',
  label: 'work',
  color: '#000',
  memberIds: ['a', 'b', 'c'],
};

describe('computeRelaxedCentroid', () => {
  it('averages the relaxed member positions', () => {
    const positions = new Map([
      ['a', { x: 0, y: 0, z: 0 }],
      ['b', { x: 6, y: 0, z: 0 }],
      ['c', { x: 0, y: 9, z: 3 }],
    ]);

    expect(computeRelaxedCentroid(cluster, positions)).toEqual({
      x: 2,
      y: 3,
      z: 1,
    });
  });

  it('skips members without a relaxed position', () => {
    const positions = new Map([
      ['a', { x: 0, y: 0, z: 0 }],
      ['b', { x: 4, y: 0, z: 0 }],
    ]);

    expect(computeRelaxedCentroid(cluster, positions)).toEqual({
      x: 2,
      y: 0,
      z: 0,
    });
  });

  it('returns undefined when no member has a position', () => {
    expect(computeRelaxedCentroid(cluster, new Map())).toBeUndefined();
  });
});
