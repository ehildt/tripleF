import { computed, inject } from 'vue';

import type {
  MediaPresentation,
  MediaPresentations,
} from '@/types/harness-response-data.model';
import { mediaPresentationsKey } from '@/types/harness-response-data.model';

const DEFAULT_MEDIA_PRESENTATIONS: MediaPresentations = {
  image: 'gallery',
  video: 'list',
};

/**
 * The presentation a media section renders in (gallery or list), driven by
 * the prompt bar's view menu. Falls back to the defaults (image → gallery,
 * video → list) when no provider is present (stories, standalone mounts), so
 * sections render normally outside the chat orchestrator.
 */
export function useHarnessMediaPresentation(media: 'image' | 'video') {
  const presentations = inject(
    mediaPresentationsKey,
    computed(() => DEFAULT_MEDIA_PRESENTATIONS),
  );
  return computed<MediaPresentation>(() => presentations.value[media]);
}
