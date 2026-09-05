import { describe, expect, it } from 'vitest';

import type { ConstellationFriction } from '../MemoryConstellation.types';
import { buildFrictionLinks } from './build-friction-links.helper';

describe('buildFrictionLinks', () => {
  it('resolves both endpoints to node indices', () => {
    const frictions: ConstellationFriction[] = [
      { source: 'a', target: 'b', reason: 'conflict' },
    ];
    const nodeIndex = new Map([
      ['a', 0],
      ['b', 1],
    ]);

    expect(buildFrictionLinks(frictions, nodeIndex)).toEqual([
      { a: 0, b: 1, kind: 'friction', alpha: 0.8 },
    ]);
  });

  it('drops a friction whose endpoint is not visible', () => {
    const frictions: ConstellationFriction[] = [
      { source: 'a', target: 'hidden' },
    ];
    const nodeIndex = new Map([['a', 0]]);

    expect(buildFrictionLinks(frictions, nodeIndex)).toEqual([]);
  });

  it('returns an empty list for no frictions', () => {
    expect(buildFrictionLinks([], new Map())).toEqual([]);
  });
});
