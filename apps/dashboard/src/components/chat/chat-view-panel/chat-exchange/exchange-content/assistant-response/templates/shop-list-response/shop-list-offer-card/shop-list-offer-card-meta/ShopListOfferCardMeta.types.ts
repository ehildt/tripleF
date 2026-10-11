/** Props for `ShopListOfferCardMeta`, the store/rating/delivery row of a shop-list card. */
export interface ShopListOfferCardMetaProps {
  /** Shop/store name. */
  store?: string;
  /** Aggregate rating rendered as stars. */
  rating?: number;
  /** Number of ratings behind the star indicator. */
  ratingCount?: number;
  /** Delivery information, when present. */
  delivery?: string;
}
