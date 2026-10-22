import type { PopoutAnchor } from '@/stores/popout-settings/popout-settings.types';
import type { VideoGalleryItem } from '@/types/assistant-response-data.model';

export interface Playlist {
  /** Unique playlist name; also the localStorage/server identity. */
  name: string;
  /** Videos in play order as returned by the backend snapshot. */
  videos: VideoGalleryItem[];
}

export type PlaylistMode = 'panel' | 'floating';

export type PlaylistAnchor = PopoutAnchor;
