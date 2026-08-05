import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import {
  addVideoToActivePlaylist,
  getActivePlaylist,
  isVideoInActivePlaylist,
  removeVideoFromActivePlaylist,
} from '@/components/widgets/floating-playlist/composables/playlist.state';
import { useToast } from '@/composables/use-toast';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

/**
 * Playlist membership toggle for one video surface: whether the video is in
 * the session's active playlist, and an action that adds or removes it. A
 * null item (no launched video yet) reports not-added and toggles nothing.
 *
 * Adding is gated on an active playlist existing: the user must create a
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
    return isVideoInActivePlaylist(video.videoUrl);
  });

  function togglePlaylistVideo() {
    const video = toValue(item);
    if (!video) return;
    if (isInPlaylist.value) {
      removeVideoFromActivePlaylist(video.videoUrl);
    } else {
      if (!getActivePlaylist()) {
        toast.warning('Create a playlist before adding videos');
        return;
      }
      addVideoToActivePlaylist(video);
    }
  }

  return { isInPlaylist, togglePlaylistVideo };
}
