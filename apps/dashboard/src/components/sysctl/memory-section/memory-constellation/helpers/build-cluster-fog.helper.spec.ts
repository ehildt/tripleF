import { describe, expect, it } from 'vitest';

import { buildClusterFog } from './build-cluster-fog.helper';

const cluster = {
  key: 'x',
  label: 'x',
  color: '#f00',
  memberIds: ['a', 'b'],
};

describe('buildClusterFog', () => {
  it('centers an expanded cluster fog on its main dot', () => {
    const fog = buildClusterFog(
      [cluster],
      new Map([
        ['a', { x: 0, y: 0, z: 0 }],
        ['b', { x: 40, y: 0, z: 0 }],
      ]),
      new Set(),
    );

    expect(fog).toHaveLength(1);
    expect(fog[0]?.center).toEqual({ x: 0, y: 0, z: 0 });
    // Furthest member (40) plus the bleed padding (60).
    expect(fog[0]?.radius).toBe(100);
  });

  it('centers a collapsed cluster fog on its members centroid', () => {
    const fog = buildClusterFog(
      [cluster],
      new Map([
        ['a', { x: 0, y: 0, z: 0 }],
        ['b', { x: 40, y: 0, z: 0 }],
      ]),
      new Set(['x']),
    );

    expect(fog[0]?.center).toEqual({ x: 20, y: 0, z: 0 });
  });

  it('skips clusters whose center has no relaxed position', () => {
    expect(buildClusterFog([cluster], new Map(), new Set())).toEqual([]);
  });
});
