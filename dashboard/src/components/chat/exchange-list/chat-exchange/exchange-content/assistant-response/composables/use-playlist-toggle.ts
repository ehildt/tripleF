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
 * cards, video gallery items, hero videos, the floating popout). A null
 * item — no launched video yet — reports not-added and toggles nothing.
 */
export function usePlaylistToggle(
  item: MaybeRefOrGetter<VideoGalleryItem | null>,
) {
  const conversationStore = useConversationStore();

  const isInPlaylist = computed(() => {
    const video = toValue(item);
    if (!video) return false;
    return isPlaylistVideo(
      conversationStore.activeConversationId ?? '',
      video.videoUrl,
    );
  });

  function togglePlaylistVideo() {
    const conversationId = conversationStore.activeConversationId ?? '';
    const video = toValue(item);
    if (!conversationId || !video) return;
    if (isInPlaylist.value) {
      removePlaylistVideo(conversationId, video.videoUrl);
    } else {
      addPlaylistVideo(conversationId, video);
    }
  }

  return { isInPlaylist, togglePlaylistVideo };
}
