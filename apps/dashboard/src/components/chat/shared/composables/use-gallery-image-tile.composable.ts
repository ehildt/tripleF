import { computed, ref } from 'vue';

import type { GalleryItem } from '@/types/harness-response-data.model';

/**
 * Shared state for one image tile (the grid tile and the carousel slide):
 * the encoded source, the accessible label fallback, and the load-error guard
 * both presentations use identically. The lightbox-open callback is passed in
 * by the owning surface (no provide/inject).
 */
export function useGalleryImageTile(
  item: GalleryItem,
  fallbackLabel: string,
  onImageClick?: (item: GalleryItem) => void,
) {
  const hasError = ref(false);
  const src = encodeURI(item.imageUrl);
  const label = computed(() => item.imageAlt || item.title || fallbackLabel);
  const isBroken = computed(() => hasError.value);

  /** Open the lightbox — skipped once the image failed to load. */
  function open() {
    if (hasError.value) return;
    onImageClick?.(item);
  }

  function handleImageError() {
    hasError.value = true;
  }

  return { src, label, isBroken, open, handleImageError };
}
