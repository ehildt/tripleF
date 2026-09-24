import type { ShopOffer } from '@/types/harness-response-data.model';

import { priceNumeric } from './price-numeric.helper';

/** Sort shop offers by ascending numeric price (non-mutating, stable). */
export function sortOffersByPrice(offers: ShopOffer[]): ShopOffer[] {
  return [...offers].sort(
    (a, b) => priceNumeric(a.price) - priceNumeric(b.price),
  );
}
