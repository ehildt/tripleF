import type { PopoutAnchor } from '@/stores/popout-settings.types';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

export interface Playlist {
  name: string;
  videos: VideoGalleryItem[];
}

export type PlaylistMode = 'panel' | 'floating';

export type PlaylistAnchor = PopoutAnchor;
