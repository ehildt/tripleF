import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import { useConversationStore } from '@/stores/conversation';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import {
  addPlaylistVideo,
  isPlaylistVideo,
  removePlaylistVideo,
} from './video-playback.state';

/**
 * Playlist membership toggle for one video surface: whether the video is in
 * the active conversation's playlist, and an action that adds or removes it.
 * Shared by every surface that offers an add-to-playlist button (videolist
 * cards, video gallery items, hero videos).
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
