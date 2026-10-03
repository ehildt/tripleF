import type { GalleryItem } from '@/types/harness-response-data.model';

export interface GallerySectionProps {
  /** Section title; the carousel shows it in its own header instead. */
  title?: string;
  /** Images to render. */
  items?: GalleryItem[];
  /** Opens the owning surface's lightbox for a clicked image. */
  onImageClick?: (item: GalleryItem) => void;
}
