import { describe, expect, it } from 'vitest';

import { sortOffersByPrice } from './sort-offers-by-price.helper';

function offer(price: string, title = 'x'): { price: string; title: string } {
  return { price, title };
}

describe('sortOffersByPrice', () => {
  it('sorts offers by ascending price', () => {
    const sorted = sortOffersByPrice([
      offer('$99.00'),
      offer('$29.99'),
      offer('$149.00'),
    ]);
    expect(sorted.map((o) => o.price)).toEqual(['$29.99', '$99.00', '$149.00']);
  });

  it('does not mutate the input', () => {
    const input = [offer('$99.00'), offer('$29.99')];
    sortOffersByPrice(input);
    expect(input.map((o) => o.price)).toEqual(['$99.00', '$29.99']);
  });

  it('sorts installment prices last', () => {
    const sorted = sortOffersByPrice([offer('$29.12/mo'), offer('$99.00')]);
    expect(sorted.map((o) => o.price)).toEqual(['$99.00', '$29.12/mo']);
  });
});
