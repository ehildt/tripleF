import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import {
  addPlaylistVideo,
  FLOATING_PLAYLIST_QUEUE_KEY,
  isPlaylistVideo,
  removePlaylistVideo,
} from './video-playback.state';

/**
 * Playlist membership toggle for one video surface: whether the video is in
 * the active queue, and an action that adds or removes it. The queue is
 * global and conversation-independent — one playlist shared by the floating
 * and docked players — so every surface toggles the same list. A null item
 * (no launched video yet) reports not-added and toggles nothing.
 */
export function usePlaylistToggle(
  item: MaybeRefOrGetter<VideoGalleryItem | null>,
) {
  const isInPlaylist = computed(() => {
    const video = toValue(item);
    if (!video) return false;
    return isPlaylistVideo(FLOATING_PLAYLIST_QUEUE_KEY, video.videoUrl);
  });

  function togglePlaylistVideo() {
    const video = toValue(item);
    if (!video) return;
    if (isInPlaylist.value) {
      removePlaylistVideo(FLOATING_PLAYLIST_QUEUE_KEY, video.videoUrl);
    } else {
      addPlaylistVideo(FLOATING_PLAYLIST_QUEUE_KEY, video);
    }
  }

  return { isInPlaylist, togglePlaylistVideo };
}
