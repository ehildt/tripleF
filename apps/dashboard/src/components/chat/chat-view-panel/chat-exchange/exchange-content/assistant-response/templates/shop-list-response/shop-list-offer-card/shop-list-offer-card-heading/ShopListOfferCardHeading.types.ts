/** Props for `ShopListOfferCardHeading`, the title/best/price row of a shop-list card. */
export interface ShopListOfferCardHeadingProps {
  /** Product title shown as the row's heading. */
  title?: string;
  /** Display price, when the offer carries one. */
  price?: string;
  /** Marks this offer as the lowest price; tints the price. */
  isBestPrice?: boolean;
}
