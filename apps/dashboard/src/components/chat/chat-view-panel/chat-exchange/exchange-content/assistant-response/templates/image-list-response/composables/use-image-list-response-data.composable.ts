import { computed } from 'vue';

import type { ImageListResponseProps } from '../ImageListResponse.types';

/**
 * Derives the image-list template's display values from the raw response:
 * the gallery items and whether any content exists.
 */
export function useImageListResponseData(props: ImageListResponseProps) {
  const items = computed(() => props.data.galleryItems ?? []);

  const hasContent = computed(
    () => Boolean(props.data.title) || items.value.length > 0,
  );

  return { items, hasContent };
}
