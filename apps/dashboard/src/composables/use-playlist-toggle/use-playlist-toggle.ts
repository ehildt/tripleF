import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import { usePlaylistCatalog } from '@/composables/use-playlist-catalog/use-playlist-catalog';
import { useToast } from '@/composables/use-toast/use-toast';
import { i18n } from '@/i18n/i18n';
import { usePlaylistStore } from '@/stores/widgets/playlist/playlist.store';
import type { VideoGalleryItem } from '@/types/assistant-response-data.model';

import type { PlaylistToggleControls } from './use-playlist-toggle.types';

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
): PlaylistToggleControls {
  const toast = useToast();
  const playlistStore = usePlaylistStore();
  const playlistCatalog = usePlaylistCatalog();

  const isInPlaylist = computed(() => {
    const video = toValue(item);
    if (!video) return false;
    return playlistStore.isVideoInActivePlaylist(video.videoUrl);
  });

  function togglePlaylistVideo(): void {
    const video = toValue(item);
    if (!video) return;
    if (isInPlaylist.value) {
      playlistCatalog.removeVideoFromActivePlaylist(video.videoUrl);
    } else {
      if (!playlistStore.activePlaylist) {
        toast.warning(i18n.global.t('toast.createPlaylistFirst'));
        return;
      }
      playlistCatalog.addVideoToActivePlaylist(video);
    }
  }

  return { isInPlaylist, togglePlaylistVideo };
}
