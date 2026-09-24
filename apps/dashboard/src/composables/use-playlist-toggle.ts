import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import { useToast } from '@/composables/use-toast';
import { i18n } from '@/i18n/i18n';
import { usePlaylistStore } from '@/stores/playlist';
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
  const playlistStore = usePlaylistStore();

  const isInPlaylist = computed(() => {
    const video = toValue(item);
    if (!video) return false;
    return playlistStore.isVideoInActivePlaylist(video.videoUrl);
  });

  function togglePlaylistVideo() {
    const video = toValue(item);
    if (!video) return;
    if (isInPlaylist.value) {
      playlistStore.removeVideoFromActivePlaylist(video.videoUrl);
    } else {
      if (!playlistStore.getActivePlaylist()) {
        toast.warning(i18n.global.t('toast.createPlaylistFirst'));
        return;
      }
      playlistStore.addVideoToActivePlaylist(video);
    }
  }

  return { isInPlaylist, togglePlaylistVideo };
}
