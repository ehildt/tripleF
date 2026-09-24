import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import { usePlaylistToggle } from '@/composables/use-playlist-toggle';
import { buildVideoPosterUrl } from '@/stores/helpers/harness/media/build-video-poster-url.helper';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

/**
 * Shared state for one video tile (the card-grid item and the carousel
 * slide): the poster URL (thumbnail when present, else derived from the
 * video URL) and the playlist membership toggle.
 */
export function useVideoGalleryTile(item: MaybeRefOrGetter<VideoGalleryItem>) {
  const posterUrl = computed(() => {
    const video = toValue(item);
    return video.thumbnailUrl || buildVideoPosterUrl(video.videoUrl);
  });

  const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(item);

  return { posterUrl, isInPlaylist, togglePlaylistVideo };
}
