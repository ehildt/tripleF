import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { usePlaylistStore } from '@/stores/widgets/playlist/playlist.store';

import type { PlaylistPanelState } from './use-playlist-panel.types';

/** Derive whether the active playlist has videos available to queue. */
export function usePlaylistPanel(): PlaylistPanelState {
  const playlistStore = usePlaylistStore();
  const { activePlaylistVideos } = storeToRefs(playlistStore);
  const hasQueuedVideos = computed(() => activePlaylistVideos.value.length > 0);

  return { hasQueuedVideos };
}
