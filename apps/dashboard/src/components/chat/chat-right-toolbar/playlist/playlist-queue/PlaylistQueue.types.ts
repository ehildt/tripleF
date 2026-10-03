import type { VideoGalleryItem } from '@/types/harness-response-data.model';

export interface PlaylistQueueProps {
  /** The queued videos, in add order. */
  videos: VideoGalleryItem[];
  /** URL of the currently playing video (highlighted in the list). */
  activeVideoUrl: string | null;
}
