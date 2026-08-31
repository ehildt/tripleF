import { describe, expect, it } from 'vitest';

import { mapEodhdSearchResult } from './map-eodhd-search-result.helper.js';

describe('mapEodhdSearchResult', () => {
  it('normalizes a PascalCase search result to camelCase', () => {
    expect(
      mapEodhdSearchResult({
        Code: 'AAPL',
        Name: 'Apple Inc.',
        Exchange: 'NASDAQ',
        Type: 'Common Stock',
        Country: 'USA',
        Currency: 'USD',
        ISIN: 'US0378331005',
        previousClose: 200,
        previousCloseDate: '2025-01-01',
        isPrimary: true,
      }),
    ).toEqual({
      code: 'AAPL',
      name: 'Apple Inc.',
      exchange: 'NASDAQ',
      type: 'Common Stock',
      country: 'USA',
      currency: 'USD',
      isin: 'US0378331005',
      previousClose: 200,
      previousCloseDate: '2025-01-01',
      isPrimary: true,
    });
  });
});
