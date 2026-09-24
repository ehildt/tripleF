import { describe, expect, it } from 'vitest';

import { priceNumeric } from './price-numeric.helper';

describe('priceNumeric', () => {
  it('parses plain prices with currency symbols', () => {
    expect(priceNumeric('€289.00')).toBe(289);
    expect(priceNumeric('$1,299')).toBe(1299);
  });

  it('sorts missing prices last', () => {
    expect(priceNumeric(undefined)).toBe(Infinity);
    expect(priceNumeric('')).toBe(Infinity);
  });

  it('sorts installment and subscription prices last', () => {
    expect(priceNumeric('$29.12/mo')).toBe(Infinity);
    expect(priceNumeric('€99/year')).toBe(Infinity);
  });

  it('sorts unparseable prices last', () => {
    expect(priceNumeric('Check price')).toBe(Infinity);
  });
});
