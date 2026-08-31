import { describe, expect, it } from 'vitest';

import { mapEodhdQuote } from './map-eodhd-quote.helper.js';

describe('mapEodhdQuote', () => {
  it('renames change_p to changeP and keeps the rest', () => {
    expect(
      mapEodhdQuote({
        code: 'AAPL',
        open: 100,
        high: 110,
        low: 90,
        close: 105,
        change_p: 1.5,
      }),
    ).toEqual({
      code: 'AAPL',
      open: 100,
      high: 110,
      low: 90,
      close: 105,
      changeP: 1.5,
    });
  });
});
