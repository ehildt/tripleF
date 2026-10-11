import type { ShopOffer } from '@/types/harness-response-data.model';

/** Props for `ShopListOfferCard`, one compact purchase option. */
export interface ShopListOfferCardProps {
  /** The offer to render: shop, rating, delivery, price, and link. */
  offer: ShopOffer;
  /** Marks this offer as the lowest price among the list's options. */
  isBestPrice?: boolean;
}
