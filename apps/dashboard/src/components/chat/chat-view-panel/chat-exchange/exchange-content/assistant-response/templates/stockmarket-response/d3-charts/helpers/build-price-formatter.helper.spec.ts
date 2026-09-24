import { describe, expect, it } from 'vitest';

import { buildPriceFormatter } from './build-price-formatter.helper';

describe('buildPriceFormatter', () => {
  it('formats with two decimals when no currency is given', () => {
    const format = buildPriceFormatter();
    expect(format(228.5)).toBe('228.50');
  });

  it('formats as currency when a currency is given', () => {
    const format = buildPriceFormatter('USD');
    expect(format(228.5)).toContain('228.50');
  });
});
