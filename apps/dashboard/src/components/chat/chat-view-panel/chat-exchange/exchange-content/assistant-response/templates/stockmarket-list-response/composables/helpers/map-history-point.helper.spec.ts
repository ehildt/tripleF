import { describe, expect, it } from 'vitest';

import { mapHistoryPoint } from './map-history-point.helper';

describe('mapHistoryPoint', () => {
  it('projects a history point into the series-point shape', () => {
    expect(mapHistoryPoint({ time: '2025-01-01', close: 100 })).toEqual({
      time: '2025-01-01',
      value: 100,
    });
  });
});
