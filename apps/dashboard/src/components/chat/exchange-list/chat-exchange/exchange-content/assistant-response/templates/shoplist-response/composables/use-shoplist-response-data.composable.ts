import { computed } from 'vue';

import type { ShopOffer } from '@/types/harness-response-data.model';

import { sortOffersByPrice } from '../../../shared/helpers/sort-offers-by-price.helper';
import type { ShopListResponseProps } from '../ShopListResponse.types';

/**
 * Derives the shop-list template's display values from the raw response:
 * the price-sorted offers and whether any content exists.
 */
export function useShopListResponseData(props: ShopListResponseProps) {
  const offers = computed<ShopOffer[]>(() =>
    sortOffersByPrice(props.data.shopOffers ?? []),
  );

  const hasContent = computed(
    () => Boolean(props.data.title) || offers.value.length > 0,
  );

  return { offers, hasContent };
}
