import type { GalleryItem } from '@/types/harness-response-data.model';

export interface ImageGridProps {
  /** The gallery items to render as grid tiles. */
  items: GalleryItem[];
}
