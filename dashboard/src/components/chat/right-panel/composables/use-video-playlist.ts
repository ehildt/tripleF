import { computed } from 'vue';

import { getActivePlaylistVideos } from '@/components/widgets/floating-playlist/composables/playlist.state';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

/**
 * The session's playlist: the videos of the active playlist, in add order.
 * The playlist is global across conversations. Additions and removals react
 * immediately because they share one module-level state. Used by the chat
 * right panel and the app-level floating playlist.
 */
export function useVideoPlaylist() {
  const playlistVideos = computed<VideoGalleryItem[]>(() =>
    getActivePlaylistVideos(),
  );

  const hasPlaylist = computed(() => playlistVideos.value.length > 0);

  return { playlistVideos, hasPlaylist };
}
