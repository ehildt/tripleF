import type { PlaylistMode } from '@/stores/widgets/playlist-settings/playlist-settings.types';

export interface PlaylistSettingsControls {
  /** Apply docking mode and surface the floating widget when enabled. */
  setPlaylistMode: (mode: PlaylistMode) => void;
}
