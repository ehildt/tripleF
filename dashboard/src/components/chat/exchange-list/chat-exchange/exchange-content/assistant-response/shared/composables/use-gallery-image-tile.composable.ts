import { computed, inject, ref } from 'vue';

import type {
  GalleryItem,
  HarnessImageClickedHandler,
} from '@/types/harness-response-data.model';
import { harnessImageClickedKey } from '@/types/harness-response-data.model';

/**
 * Shared state for one image tile (the grid tile and the carousel slide):
 * the lightbox click handler injected by the chat orchestrator, the encoded
 * source, the accessible label fallback, and the load-error guard both
 * presentations use identically.
 */
export function useGalleryImageTile(item: GalleryItem, fallbackLabel: string) {
  const onImageClicked = inject<HarnessImageClickedHandler>(
    harnessImageClickedKey,
    () => undefined,
  );

  const hasError = ref(false);
  const src = encodeURI(item.imageUrl);
  const label = computed(() => item.imageAlt || item.title || fallbackLabel);
  const isBroken = computed(() => hasError.value);

  /** Open the lightbox — skipped once the image failed to load. */
  function open() {
    if (hasError.value) return;
    onImageClicked?.(item);
  }

  function handleImageError() {
    hasError.value = true;
  }

  return { src, label, isBroken, open, handleImageError };
}
