import { describe, expect, it } from 'vitest';

import { markerTextShift } from './marker-text-shift.helper';

describe('markerTextShift', () => {
  it('returns 0 when no line collides with the text block', () => {
    expect(markerTextShift(100, false, [])).toBe(0);
  });

  it('steps below-bar text down until clear of a colliding line', () => {
    expect(markerTextShift(100, false, [120])).toBe(12);
  });

  it('steps above-bar text up for a colliding line', () => {
    expect(markerTextShift(100, true, [80])).toBe(-12);
  });

  it("ignores the marker's own anchor line within 3px", () => {
    expect(markerTextShift(100, false, [101])).toBe(0);
  });
});
