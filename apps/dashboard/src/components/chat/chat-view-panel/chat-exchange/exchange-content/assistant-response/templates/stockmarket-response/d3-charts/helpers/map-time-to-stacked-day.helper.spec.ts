import { describe, expect, it } from 'vitest';

import { mapTimeToStackedDay } from './map-time-to-stacked-day.helper';

describe('mapTimeToStackedDay', () => {
  it('carries forward the last value per series', () => {
    const prepared = [
      [
        { time: 'a', value: 1 },
        { time: 'c', value: 3 },
      ],
      [{ time: 'b', value: 2 }],
    ];
    const lastBySeries = [0, 0];
    const hasValue = [false, false];

    const a = mapTimeToStackedDay('a', prepared, lastBySeries, hasValue);
    expect(a).toEqual({ time: 'a', values: [1, 0] });

    const b = mapTimeToStackedDay('b', prepared, lastBySeries, hasValue);
    expect(b).toEqual({ time: 'b', values: [1, 2] });
  });
});
