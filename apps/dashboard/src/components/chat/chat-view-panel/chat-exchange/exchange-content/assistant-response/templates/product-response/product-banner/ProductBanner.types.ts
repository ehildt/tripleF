import type { GalleryItem } from '@/types/harness-response-data.model';

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
  /** Opens the owning surface's lightbox for the clicked banner image. */
  onImageClick?: (item: GalleryItem) => void;
}
