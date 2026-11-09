import { useFloatingPlaylistOpen } from '@/components/widgets/floating-playlist/composables/use-floating-playlist-open';
import { usePlaylistSettingsStore } from '@/stores/widgets/playlist-settings/playlist-settings.store';
import type { PlaylistMode } from '@/stores/widgets/playlist-settings/playlist-settings.types';

import type { PlaylistSettingsControls } from './use-playlist-settings.types';

/** Compose playlist preference changes with floating-window presentation. */
export function usePlaylistSettings(): PlaylistSettingsControls {
  const settingsStore = usePlaylistSettingsStore();
  const floatingPlaylist = useFloatingPlaylistOpen();

  function setPlaylistMode(mode: PlaylistMode): void {
    settingsStore.setPlaylistMode(mode);
    if (mode === 'floating') floatingPlaylist.openFloatingPlaylist();
  }

  return { setPlaylistMode };
}
