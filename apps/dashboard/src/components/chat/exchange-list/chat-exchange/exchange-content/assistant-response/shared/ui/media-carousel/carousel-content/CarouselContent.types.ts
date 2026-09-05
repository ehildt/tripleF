import type { MediaItem } from '@/types/harness-response-data.model';

export interface CarouselContentProps {
  items: MediaItem[];
  /** Currently active slide; drives the item states and button disabling. */
  activeIndex: number;
  /** Parent-managed slides (e.g. the attachments gallery) show a per-slide
   * remove action instead of add-to-files. */
  removable?: boolean;
}
