import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import { useConversationStore } from '@/stores/conversation';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import {
  addPlaylistVideo,
  isPlaylistVideo,
  removePlaylistVideo,
} from '../../../../composables/video-playback.state';

/**
 * Playlist membership toggle for one videolist card: whether the video is in
 * the active conversation's playlist, and an action that adds or removes it.
 */
export function usePlaylistToggle(item: MaybeRefOrGetter<VideoGalleryItem>) {
  const conversationStore = useConversationStore();

  const isInPlaylist = computed(() =>
    isPlaylistVideo(
      conversationStore.activeConversationId ?? '',
      toValue(item).videoUrl,
    ),
  );

  function togglePlaylistVideo() {
    const conversationId = conversationStore.activeConversationId ?? '';
    if (!conversationId) return;
    const video = toValue(item);
    if (isInPlaylist.value) {
      removePlaylistVideo(conversationId, video.videoUrl);
    } else {
      addPlaylistVideo(conversationId, video);
    }
  }

  return { isInPlaylist, togglePlaylistVideo };
}
