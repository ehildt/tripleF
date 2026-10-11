import { describe, expect, it } from 'vitest';

import { isPriceToken } from './is-price-token.helper';

describe('isPriceToken', () => {
  it('accepts digits, dots, and commas', () => {
    expect(isPriceToken('1,234.56')).toBe(true);
  });

  it('rejects letters and symbols', () => {
    expect(isPriceToken('12.5 USD')).toBe(false);
    expect(isPriceToken('abc')).toBe(false);
  });
});
