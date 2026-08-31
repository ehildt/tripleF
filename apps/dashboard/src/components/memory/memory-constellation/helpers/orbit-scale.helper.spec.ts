import { describe, expect, it } from 'vitest';

import type { DotTransition } from '../MemoryConstellation.types';
import { orbitScaleFor } from './orbit-scale.helper';

function transition(kind: DotTransition['kind']): DotTransition {
  return {
    start: { x: 0, y: 0, z: 0 },
    end: { x: 10, y: 0, z: 0 },
    startTime: 0,
    duration: 1000,
    kind,
  };
}

describe('orbitScaleFor', () => {
  it('returns full orbit when there is no transition', () => {
    expect(orbitScaleFor(undefined, 0)).toBe(1);
  });

  it('starts a collapse at full orbit (no jump) and ends at zero', () => {
    const t = transition('collapse');
    expect(orbitScaleFor(t, 0)).toBe(1);
    expect(orbitScaleFor(t, 500)).toBeCloseTo(1 - 0.5 ** 3);
    expect(orbitScaleFor(t, 1000)).toBe(0);
    expect(orbitScaleFor(t, 2000)).toBe(0);
  });

  it('starts an expand at zero and ends at full orbit', () => {
    const t = transition('expand');
    expect(orbitScaleFor(t, 0)).toBe(0);
    expect(orbitScaleFor(t, 500)).toBeCloseTo(1 - 0.5 ** 3);
    expect(orbitScaleFor(t, 1000)).toBe(1);
  });
});
