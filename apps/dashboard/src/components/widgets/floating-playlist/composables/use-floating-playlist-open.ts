import { ref } from 'vue';

import type { FloatingPlaylistOpenControls } from './use-floating-playlist-open.types';

// Module-scope singleton: the app marquee and floating widget must observe
// the same window state. Tests using this composable close it between cases.
const floatingPlaylistOpen = ref(false);

/** Own the floating window's transient open state without DOM listeners. */
export function useFloatingPlaylistOpen(): FloatingPlaylistOpenControls {
  function openFloatingPlaylist(): void {
    floatingPlaylistOpen.value = true;
  }

  function toggleFloatingPlaylist(): void {
    floatingPlaylistOpen.value = !floatingPlaylistOpen.value;
  }

  function closeFloatingPlaylist(): void {
    floatingPlaylistOpen.value = false;
  }

  return {
    floatingPlaylistOpen,
    openFloatingPlaylist,
    toggleFloatingPlaylist,
    closeFloatingPlaylist,
  };
}
