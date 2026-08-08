export interface ProductBannerProps {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageCaption?: string;
  /** Total number of images for this product (banner + gallery). */
  imageCount?: number;
  rating?: number;
  ratingCount?: number;
  ratingLabel?: string;
}
