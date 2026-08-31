import { describe, expect, it } from 'vitest';

import { mapRangeRowToDateRange } from './map-range-row-to-date-range.helper.js';

describe('mapRangeRowToDateRange', () => {
  it('converts a coverage ledger row into a date range', () => {
    expect(
      mapRangeRowToDateRange({
        ticker: 'AAPL',
        fromDate: new Date('2025-01-01T00:00:00Z'),
        toDate: new Date('2025-01-31T00:00:00Z'),
        fetchedAt: new Date('2025-02-01T00:00:00Z'),
      }),
    ).toEqual({ from: '2025-01-01', to: '2025-01-31' });
  });
});
