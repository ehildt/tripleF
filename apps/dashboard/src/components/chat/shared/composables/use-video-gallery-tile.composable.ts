import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import { buildVideoPosterUrl } from '@/stores/helpers/harness/media/build-video-poster-url.helper';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

/**
 * Shared poster URL for one video tile (the card-grid item and the carousel
 * slide): the thumbnail when present, else derived from the video URL. The
 * playlist membership toggle is bound by the tile consumers directly from
 * `usePlaylistToggle` — it is not re-exported here.
 */
export function useVideoGalleryTile(item: MaybeRefOrGetter<VideoGalleryItem>) {
  const posterUrl = computed(() => {
    const video = toValue(item);
    return video.thumbnailUrl || buildVideoPosterUrl(video.videoUrl);
  });

  return { posterUrl };
}
