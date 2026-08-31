import { describe, expect, it } from 'vitest';

import type { DotTransition } from '../MemoryConstellation.types';
import { interpolateTransitionPosition } from './interpolate-transition-position.helper';

const FINAL = { x: 100, y: 0, z: 0 };

describe('interpolateTransitionPosition', () => {
  it('returns the final position without a transition', () => {
    expect(interpolateTransitionPosition(undefined, FINAL, 1000)).toEqual(
      FINAL,
    );
  });

  it('interpolates an expand from the start toward the end', () => {
    const transition: DotTransition = {
      start: { x: 0, y: 0, z: 0 },
      end: { x: 100, y: 0, z: 0 },
      startTime: 0,
      duration: 1000,
      kind: 'expand',
    };

    expect(interpolateTransitionPosition(transition, FINAL, 0)).toMatchObject({
      x: 0,
    });
    expect(
      interpolateTransitionPosition(transition, FINAL, 1000),
    ).toMatchObject({ x: 100 });
  });

  it('collapses straight back into the end position (reverse of expand)', () => {
    const transition: DotTransition = {
      start: { x: 100, y: 0, z: 50 },
      end: { x: 0, y: 0, z: 0 },
      startTime: 0,
      duration: 1000,
      kind: 'collapse',
    };

    const start = interpolateTransitionPosition(transition, FINAL, 0);
    expect(start).toEqual({ x: 100, y: 0, z: 50 });
    const end = interpolateTransitionPosition(transition, FINAL, 1000);
    expect(end).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('clamps past the transition duration', () => {
    const transition: DotTransition = {
      start: { x: 0, y: 0, z: 0 },
      end: { x: 100, y: 0, z: 0 },
      startTime: 0,
      duration: 1000,
      kind: 'expand',
    };

    expect(
      interpolateTransitionPosition(transition, FINAL, 5000),
    ).toMatchObject({ x: 100 });
  });
});
