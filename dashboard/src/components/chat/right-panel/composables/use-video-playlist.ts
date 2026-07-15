import { computed, type Ref } from 'vue';

import type { Conversation } from '@/stores/conversation';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import { addedPlaylistVideos } from '../../exchange-list/chat-exchange/exchange-content/assistant-response/composables/video-playback.state';

/**
 * The active conversation's playlist: the videos the user explicitly added
 * from videolist cards, in add order. Additions and removals react
 * immediately because they share one module-level state.
 */
export function useVideoPlaylist(conversation: Ref<Conversation | null>) {
  const playlistVideos = computed<VideoGalleryItem[]>(
    () => addedPlaylistVideos.value.get(conversation.value?.id ?? '') ?? [],
  );

  const hasPlaylist = computed(() => playlistVideos.value.length > 0);

  return { playlistVideos, hasPlaylist };
}
