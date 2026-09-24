import type { VideoGalleryItem } from '@/types/harness-response-data.model';

export interface PlaylistItemProps {
  item: VideoGalleryItem;
  /** True for the now-playing item (scrolls its title as a marquee). */
  isActive: boolean;
}
