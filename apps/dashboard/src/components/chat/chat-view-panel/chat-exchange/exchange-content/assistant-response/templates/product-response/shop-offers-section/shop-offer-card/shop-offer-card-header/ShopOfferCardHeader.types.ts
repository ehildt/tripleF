/** Props for `ShopOfferCardHeader`, the shop identity row of an offer card. */
export interface ShopOfferCardHeaderProps {
  /** Shop/store name shown as the row's title. */
  shop?: string;
  /** Aggregate rating rendered as stars. */
  rating?: number;
  /** Number of ratings behind the star indicator. */
  ratingCount?: number;
  /** Marks this offer as the lowest price among the list's options. */
  isBestPrice?: boolean;
}
