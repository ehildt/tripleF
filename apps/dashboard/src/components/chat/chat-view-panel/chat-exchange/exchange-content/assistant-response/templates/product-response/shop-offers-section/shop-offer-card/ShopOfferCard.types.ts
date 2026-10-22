import type { ShopOffer } from '@/types/assistant-response-data.model';

/** Props for `ShopOfferCard`, one purchase offer. */
export interface ShopOfferCardProps {
  /** The offer to render. */
  offer: ShopOffer;
  /** Marks this offer as the lowest price. */
  isBestPrice?: boolean;
}
