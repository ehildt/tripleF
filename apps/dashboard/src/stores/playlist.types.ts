import type { VideoGalleryItem } from '@/types/harness-response-data.model';

export interface Playlist {
  name: string;
  videos: VideoGalleryItem[];
}
