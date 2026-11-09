import { onClickOutside, onKeyStroke } from '@vueuse/core';
import type { Ref } from 'vue';

import { usePlaylistSettingsStore } from '@/stores/widgets/playlist-settings/playlist-settings.store';

import { useFloatingPlaylistOpen } from './use-floating-playlist-open';
import type { FloatingPlaylistVisibilityControls } from './use-floating-playlist-visibility.types';

/**
 * Bind component-scoped outside-click and Escape listeners to the shared
 * floating window state. Only the mounted floating component owns listeners;
 * readers such as the app marquee use useFloatingPlaylistOpen directly.
 */
export function useFloatingPlaylistVisibility(
  playlistRef: Ref<HTMLElement | null>,
): FloatingPlaylistVisibilityControls {
  const settingsStore = usePlaylistSettingsStore();
  const floatingPlaylist = useFloatingPlaylistOpen();

  function closeOnAutoclose(): void {
    if (settingsStore.playlistAutoClose) {
      floatingPlaylist.closeFloatingPlaylist();
    }
  }

  onClickOutside(playlistRef, closeOnAutoclose);
  onKeyStroke('Escape', () => {
    if (floatingPlaylist.floatingPlaylistOpen.value) {
      floatingPlaylist.closeFloatingPlaylist();
    }
  });

  return { closeOnAutoclose };
}
