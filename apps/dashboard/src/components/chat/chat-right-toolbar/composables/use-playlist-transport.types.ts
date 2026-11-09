import type { ComputedRef } from 'vue';

import type { VideoGalleryItem } from '@/types/assistant-response-data.model';

export interface PlaylistTransportControls {
  /** Playlist metadata title or the launched video's announced title. */
  activePlaybackTitle: ComputedRef<string>;
  /** Whether the floating player is suppressed or dismissed. */
  popoutHidden: ComputedRef<boolean>;
  /** Toggle the setting or dismissed-window state that hides the popout. */
  toggleHideOnPlaylist: () => void;
  /** Whether a video is currently launched. */
  hasActivePlayback: ComputedRef<boolean>;
  /** Whether the active provider supports play/pause control. */
  canTogglePlayback: ComputedRef<boolean>;
  /** Human-readable playback toggle state or provider limitation. */
  playbackToggleTitle: ComputedRef<string>;
  /** Launch a queue item with the active playlist as its playback queue. */
  onPlayItem: (item: VideoGalleryItem) => void;
}
