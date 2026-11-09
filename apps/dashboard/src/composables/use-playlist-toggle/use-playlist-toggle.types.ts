import type { ComputedRef } from 'vue';

export interface PlaylistToggleControls {
  /** Whether the supplied video belongs to the active playlist. */
  isInPlaylist: ComputedRef<boolean>;
  /** Add or remove the supplied video, warning when no playlist exists. */
  togglePlaylistVideo: () => void;
}
