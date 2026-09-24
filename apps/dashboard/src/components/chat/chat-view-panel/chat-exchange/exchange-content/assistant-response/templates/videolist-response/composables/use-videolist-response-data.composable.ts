import { computed } from 'vue';

import type { VideoListResponseProps } from '../VideoListResponse.types';

/**
 * Derives the video-list template's display values from the raw response:
 * the gallery items and whether any content exists.
 */
export function useVideoListResponseData(props: VideoListResponseProps) {
  const items = computed(() => props.data.videoGalleryItems ?? []);

  const hasContent = computed(
    () => Boolean(props.data.title) || items.value.length > 0,
  );

  return { items, hasContent };
}
