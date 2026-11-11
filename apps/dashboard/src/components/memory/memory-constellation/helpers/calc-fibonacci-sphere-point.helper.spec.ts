import { describe, expect, it } from 'vitest';

import { calcFibonacciSpherePoint } from './calc-fibonacci-sphere-point.helper';

describe('calcFibonacciSpherePoint', () => {
  it('places every point at the requested radius', () => {
    for (let index = 0; index < 8; index++) {
      const point = calcFibonacciSpherePoint(index, 8, 120);
      expect(Math.hypot(point.x, point.y, point.z)).toBeCloseTo(120);
    }
  });

  it('spreads points across both hemispheres', () => {
    const points = Array.from({ length: 6 }, (_, index) =>
      calcFibonacciSpherePoint(index, 6, 100),
    );

    expect(points.some((point) => point.z > 0)).toBe(true);
    expect(points.some((point) => point.z < 0)).toBe(true);
  });

  it('is deterministic for the same input', () => {
    expect(calcFibonacciSpherePoint(2, 8, 120)).toEqual(
      calcFibonacciSpherePoint(2, 8, 120),
    );
  });
});
