import type { GalleryItem } from '@/types/harness-response-data.model';

export interface CarouselContentProps {
  items: GalleryItem[];
  /** Currently active slide; drives the item states and button disabling. */
  activeIndex: number;
}
