import { computed } from 'vue';

import { usePlaylistStore } from '@/stores/playlist';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

/**
 * Component-scoped state for the playlist panel: the queued videos of the
 * active playlist and whether the queue has content. Lives here — not in a
 * store — because only the playlist panel needs the queue list.
 */
export function usePlaylistPanel() {
  const playlistStore = usePlaylistStore();

  const playlistVideos = computed<VideoGalleryItem[]>(() =>
    playlistStore.getActivePlaylistVideos(),
  );

  const hasQueuedVideos = computed(() => playlistVideos.value.length > 0);

  return {
    playlistVideos,
    hasQueuedVideos,
  };
}
