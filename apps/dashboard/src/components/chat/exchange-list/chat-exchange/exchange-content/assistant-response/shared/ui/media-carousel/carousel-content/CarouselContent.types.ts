import type { MediaItem } from '@/types/harness-response-data.model';

export interface CarouselContentProps {
  items: MediaItem[];
  /** Currently active slide; drives the item states and button disabling. */
  activeIndex: number;
}
