/** Props for `ProductBannerRating`, the always-visible rating overlay. */
export interface ProductBannerRatingProps {
  /** Numeric rating shown in the stars. */
  rating: number;
  /** Number of ratings, shown in the stars and the formatted count. */
  ratingCount?: number;
  /** Pre-formatted one-decimal rating value (e.g. "4.6"). */
  ratingValue: string;
  /** Pre-formatted "N reviews" text, empty when there is no count. */
  countText?: string;
  /** Editorial rating label (e.g. "Excellent"). */
  label?: string;
}
