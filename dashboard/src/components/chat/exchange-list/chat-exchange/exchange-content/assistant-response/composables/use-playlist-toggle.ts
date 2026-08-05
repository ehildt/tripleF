import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import { savedPlaylists } from '@/components/widgets/floating-playlist/composables/saved-playlists.state';
import { useToast } from '@/composables/use-toast';
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
 *
 * Adding is gated on a saved playlist existing: the user must create a
 * playlist before videos can be added, otherwise a toast explains why the
 * add was ignored (the toast only surfaces when notifications are enabled).
 */
export function usePlaylistToggle(
  item: MaybeRefOrGetter<VideoGalleryItem | null>,
) {
  const toast = useToast();

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
      if (savedPlaylists.value.length === 0) {
        toast.warning('Create a playlist before adding videos');
        return;
      }
      addPlaylistVideo(FLOATING_PLAYLIST_QUEUE_KEY, video);
    }
  }

  return { isInPlaylist, togglePlaylistVideo };
}
