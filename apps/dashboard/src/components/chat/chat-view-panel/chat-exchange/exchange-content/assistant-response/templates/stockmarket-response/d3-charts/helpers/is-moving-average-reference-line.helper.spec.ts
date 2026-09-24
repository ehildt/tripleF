import { describe, expect, it } from 'vitest';

import { isMovingAverageReferenceLine } from './is-moving-average-reference-line.helper';

describe('isMovingAverageReferenceLine', () => {
  it('detects moving-average labels', () => {
    expect(isMovingAverageReferenceLine({ value: 100, label: 'MA 20' })).toBe(
      true,
    );
    expect(isMovingAverageReferenceLine({ value: 100, label: 'SMA 50' })).toBe(
      true,
    );
    expect(
      isMovingAverageReferenceLine({
        value: 100,
        label: 'Moving average',
      }),
    ).toBe(true);
  });

  it('keeps non-moving-average labels', () => {
    expect(
      isMovingAverageReferenceLine({ value: 100, label: 'Resistance' }),
    ).toBe(false);
  });

  it('treats unlabeled lines as not moving averages', () => {
    expect(isMovingAverageReferenceLine({ value: 100 })).toBe(false);
  });
});
