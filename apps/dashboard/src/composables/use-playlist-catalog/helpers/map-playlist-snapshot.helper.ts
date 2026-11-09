import type { Playlist } from '@/stores/widgets/playlist/playlist.types';
import type { PlaylistSnapshot } from '@/types/playlist.model';

import { isVideoGalleryItem } from './is-video-gallery-item.helper';

/** Project a server snapshot into validated playlist view data. */
export function mapPlaylistSnapshot(snapshot: PlaylistSnapshot): Playlist {
  return {
    name: snapshot.name,
    videos: Array.isArray(snapshot.videos)
      ? snapshot.videos.filter(isVideoGalleryItem)
      : [],
  };
}
