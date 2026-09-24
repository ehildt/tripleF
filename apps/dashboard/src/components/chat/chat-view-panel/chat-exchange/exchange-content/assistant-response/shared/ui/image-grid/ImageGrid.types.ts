import type { GalleryItem } from '@/types/harness-response-data.model';

export interface ImageGridProps {
  /** The gallery items to render as grid tiles. */
  items: GalleryItem[];
  /** Opens the owning surface's lightbox for a clicked image. */
  onImageClick?: (item: GalleryItem) => void;
}
