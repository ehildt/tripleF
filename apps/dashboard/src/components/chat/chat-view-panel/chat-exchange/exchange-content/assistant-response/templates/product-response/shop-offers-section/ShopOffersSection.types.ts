import type { ShopOffer } from '@/types/assistant-response-data.model';

/** Props for `ShopOffersSection`, the list of purchase offers. */
export interface ShopOffersSectionProps {
  /** Offers rendered as cards. */
  offers: readonly ShopOffer[];
}
