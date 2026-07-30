import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import { useConversationStore } from '@/stores/conversation';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import {
  addPlaylistVideo,
  isPlaylistVideo,
  playlistQueueKey,
  removePlaylistVideo,
} from './video-playback.state';

/**
 * Playlist membership toggle for one video surface: whether the video is in
 * the active queue, and an action that adds or removes it. The queue is
 * conversation-scoped in panel mode and global in floating mode (see
 * playlistQueueKey). Shared by every surface that offers an add-to-playlist
 * button (videolist cards, video gallery items, hero videos, the floating
 * popout). A null item — no launched video yet — reports not-added and
 * toggles nothing.
 */
export function usePlaylistToggle(
  item: MaybeRefOrGetter<VideoGalleryItem | null>,
) {
  const conversationStore = useConversationStore();

  const queueKey = computed(() =>
    playlistQueueKey(conversationStore.activeConversationId ?? ''),
  );

  const isInPlaylist = computed(() => {
    const video = toValue(item);
    if (!video) return false;
    return isPlaylistVideo(queueKey.value, video.videoUrl);
  });

  function togglePlaylistVideo() {
    const key = queueKey.value;
    const video = toValue(item);
    if (!key || !video) return;
    if (isInPlaylist.value) {
      removePlaylistVideo(key, video.videoUrl);
    } else {
      addPlaylistVideo(key, video);
    }
  }

  return { isInPlaylist, togglePlaylistVideo };
}
