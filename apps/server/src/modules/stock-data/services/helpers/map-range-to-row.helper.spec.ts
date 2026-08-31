import { describe, expect, it } from 'vitest';

import { mapRangeToRow } from './map-range-to-row.helper.js';

describe('mapRangeToRow', () => {
  it('converts a range into a ledger row', () => {
    const row = mapRangeToRow({ from: '2025-01-01', to: '2025-01-31' }, 'AAPL');
    expect(row.ticker).toBe('AAPL');
    expect(row.fromDate.toISOString()).toBe('2025-01-01T00:00:00.000Z');
    expect(row.toDate.toISOString()).toBe('2025-01-31T00:00:00.000Z');
  });
});
