import { describe, expect, it } from 'vitest';

import { buildTopicFog } from './build-topic-fog.helper';

const topic = {
  key: 'x',
  label: 'x',
  color: '#f00',
  memberIds: ['a', 'b'],
};

describe('buildTopicFog', () => {
  it('centers an expanded topic fog on its main dot', () => {
    const fog = buildTopicFog(
      [topic],
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

  it('centers a collapsed topic fog on its members centroid', () => {
    const fog = buildTopicFog(
      [topic],
      new Map([
        ['a', { x: 0, y: 0, z: 0 }],
        ['b', { x: 40, y: 0, z: 0 }],
      ]),
      new Set(['x']),
    );

    expect(fog[0]?.center).toEqual({ x: 20, y: 0, z: 0 });
  });

  it('skips topics whose center has no relaxed position', () => {
    expect(buildTopicFog([topic], new Map(), new Set())).toEqual([]);
  });
});
