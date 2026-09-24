import { describe, expect, it } from 'vitest';

import { calcConnectionOpacity } from './calc-connection-opacity.helper';

describe('calcConnectionOpacity', () => {
  it('returns 1 when distance is zero or negative', () => {
    expect(calcConnectionOpacity(0, 100)).toBe(1);
    expect(calcConnectionOpacity(-20, 100)).toBe(1);
  });

  it('returns 0 when distance equals or exceeds the maximum', () => {
    expect(calcConnectionOpacity(100, 100)).toBe(0);
    expect(calcConnectionOpacity(150, 100)).toBe(0);
  });

  it('returns a linearly interpolated opacity between 0 and 1', () => {
    expect(calcConnectionOpacity(25, 100)).toBe(0.75);
    expect(calcConnectionOpacity(50, 100)).toBe(0.5);
    expect(calcConnectionOpacity(75, 100)).toBe(0.25);
  });
});
