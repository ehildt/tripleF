import { describe, expect, it } from 'vitest';

import { orbitPosition } from './orbit-position.helper';

describe('orbitPosition', () => {
  it('rotates a position around its center in the x-y plane', () => {
    const center = { x: 0, y: 0, z: 0 };
    const position = { x: 10, y: 0, z: 5 };

    const rotated = orbitPosition(position, center, Math.PI / 2);

    expect(rotated.x).toBeCloseTo(0);
    expect(rotated.y).toBeCloseTo(10);
    expect(rotated.z).toBe(5);
  });

  it('keeps the center fixed and preserves the radius', () => {
    const center = { x: 3, y: 4, z: 0 };
    const position = { x: 6, y: 8, z: 0 };

    const rotated = orbitPosition(position, center, 1.2);

    const radius = Math.hypot(rotated.x - center.x, rotated.y - center.y);
    expect(radius).toBeCloseTo(5);
  });

  it('returns the position unchanged at angle zero', () => {
    const center = { x: 1, y: 1, z: 1 };
    const position = { x: 4, y: 5, z: 6 };

    expect(orbitPosition(position, center, 0)).toEqual(position);
  });

  it('scales the orbit offset toward zero (0 = no orbit)', () => {
    const center = { x: 0, y: 0, z: 0 };
    const position = { x: 10, y: 0, z: 5 };

    const half = orbitPosition(position, center, Math.PI / 2, 0.5);
    expect(half.x).toBeCloseTo(5);
    expect(half.y).toBeCloseTo(5);
    expect(half.z).toBe(5);

    expect(orbitPosition(position, center, Math.PI / 2, 0)).toEqual(position);
  });
});
