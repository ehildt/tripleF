import { computed } from 'vue';

import { useAppStore } from '@/stores/app';
import type { MediaPresentation } from '@/types/harness-response-data.model';

/**
 * The presentation a media section renders in (gallery or list), driven by
 * the prompt bar's view menu (stored in the app store, seeded with image →
 * gallery, video → list defaults).
 */
export function useHarnessMediaPresentation(media: 'image' | 'video') {
  const appStore = useAppStore();
  return computed<MediaPresentation>(() => appStore.mediaPresentations[media]);
}
