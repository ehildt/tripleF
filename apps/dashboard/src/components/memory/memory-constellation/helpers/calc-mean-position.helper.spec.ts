import { describe, expect, it } from 'vitest';

import { calcMeanPosition } from './calc-mean-position.helper';

describe('calcMeanPosition', () => {
  it('averages each coordinate independently', () => {
    expect(
      calcMeanPosition([
        { x: 10, y: 20, z: 30 },
        { x: 20, y: 30, z: 40 },
      ]),
    ).toEqual({ x: 15, y: 25, z: 35 });
  });

  it('skips missing positions', () => {
    expect(
      calcMeanPosition([undefined, { x: 10, y: 20, z: 30 }, undefined]),
    ).toEqual({ x: 10, y: 20, z: 30 });
  });

  it('returns the origin when no positions are defined', () => {
    expect(calcMeanPosition([undefined])).toEqual({ x: 0, y: 0, z: 0 });
  });
});
