import type { Playlist } from '@/stores/widgets/playlist/playlist.types';
import type { VideoGalleryItem } from '@/types/assistant-response-data.model';

export interface PlaylistCatalogControls {
  /** Load the shared catalog unless an equivalent request is already running. */
  loadPlaylists: () => Promise<void>;
  /** Select an existing playlist and invalidate older catalog responses. */
  selectPlaylist: (name: string) => boolean;
  /** Create, activate, and persist a uniquely named playlist. */
  createPlaylist: (name: string) => Playlist | null;
  /** Rename a playlist locally and persist a valid rename. */
  renamePlaylist: (oldName: string, newName: string) => boolean;
  /** Delete an existing playlist locally and on the server. */
  deletePlaylist: (name: string) => boolean;
  /** Import, activate, and persist a complete playlist under a unique name. */
  importPlaylist: (name: string, videos: VideoGalleryItem[]) => Playlist | null;
  /** Add and persist a new active-queue video. */
  addVideoToActivePlaylist: (video: VideoGalleryItem) => boolean;
  /** Remove and persist an existing active-queue video. */
  removeVideoFromActivePlaylist: (videoUrl: string) => boolean;
}
