import { computed } from 'vue';

import type {
  ShopOffer,
  VideoGalleryItem,
} from '@/types/harness-response-data.model';

import { sortOffersByPrice } from '../../../shared/helpers/sort-offers-by-price.helper';
import type { ProductResponseProps } from '../ProductResponse.types';

/**
 * Derives the product template's display values from the raw response:
 * price-sorted offers, the capped review videos, the image count, and
 * whether any content exists.
 */
export function useProductResponseData(props: ProductResponseProps) {
  const offers = computed<ShopOffer[]>(() =>
    sortOffersByPrice(props.data.shopOffers ?? []),
  );

  /** Product-review videos, capped at 3. */
  const videos = computed<VideoGalleryItem[]>(() =>
    (props.data.videoGalleryItems ?? []).slice(0, 3),
  );

  /** Total number of product images (banner + gallery). */
  const imageCount = computed(
    () =>
      (props.data.heroImageUrl ? 1 : 0) +
      (props.data.galleryItems?.length ?? 0),
  );

  const hasContent = computed(
    () =>
      Boolean(props.data.title) ||
      offers.value.length > 0 ||
      (props.data.keyPoints?.length ?? 0) > 0,
  );

  return { offers, videos, imageCount, hasContent };
}
