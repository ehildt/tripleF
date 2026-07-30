import { computed, type Ref } from 'vue';

import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import { addedPlaylistVideos } from '../../exchange-list/chat-exchange/exchange-content/assistant-response/composables/video-playback.state';

/**
 * A conversation's playlist: the videos the user explicitly added from
 * videolist cards, in add order. Additions and removals react immediately
 * because they share one module-level state. Used by the chat right panel
 * (active conversation) and the app-level floating playlist.
 */
export function useVideoPlaylist(conversationId: Ref<string>) {
  const playlistVideos = computed<VideoGalleryItem[]>(
    () => addedPlaylistVideos.value.get(conversationId.value) ?? [],
  );

  const hasPlaylist = computed(() => playlistVideos.value.length > 0);

  return { playlistVideos, hasPlaylist };
}
