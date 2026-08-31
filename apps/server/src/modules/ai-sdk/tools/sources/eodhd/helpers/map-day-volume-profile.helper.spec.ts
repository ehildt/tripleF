import { describe, expect, it } from 'vitest';

import { mapDayVolumeProfile } from './map-day-volume-profile.helper.js';

describe('mapDayVolumeProfile', () => {
  it('builds ten price bands for a trading day', () => {
    const result = mapDayVolumeProfile(
      [
        '2025-01-01',
        [
          {
            time: '2025-01-01T10:00:00Z',
            open: 100,
            high: 101,
            low: 100,
            close: 100.5,
            volume: 50,
          },
        ],
      ],
      100,
      1,
    );
    expect(result.time).toBe('2025-01-01');
    expect(result.bands).toHaveLength(10);
    // The bar spans only the first band (low 100 → high 101).
    expect(result.bands[0]).toEqual({ low: 100, high: 101, volume: 50 });
    expect(result.bands[1]).toEqual({ low: 101, high: 102, volume: 0 });
  });
});
