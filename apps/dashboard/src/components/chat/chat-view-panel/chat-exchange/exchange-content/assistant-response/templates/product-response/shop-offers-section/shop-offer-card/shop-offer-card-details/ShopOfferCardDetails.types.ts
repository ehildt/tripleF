/** Props for `ShopOfferCardDetails`, the offer specifics row (text, delivery, price). */
export interface ShopOfferCardDetailsProps {
  /** Offer text/name. */
  title?: string;
  /** Delivery information, when present. */
  delivery?: string;
  /** Pre-formatted display price (falls back to the check-price label). */
  price: string;
  /** Marks this offer as the lowest price; tints the price. */
  isBestPrice?: boolean;
}
