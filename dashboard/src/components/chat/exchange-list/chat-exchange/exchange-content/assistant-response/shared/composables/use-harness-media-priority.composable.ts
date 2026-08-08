import { computed, inject } from 'vue';

import {
  type MediaPriority,
  mediaPriorityKey,
} from '@/types/harness-response-data.model';

/** The hero media fields the media-priority order depends on. */
export interface HarnessMediaInput {
  heroVideoUrl?: string;
  heroImageUrl?: string;
}

/**
 * Media ordering for harness responses: whether videos render before images
 * (or vice versa), driven by the app-level media-priority context. Also
 * resolves the hero media URL (video preferred over image).
 */
export function useHarnessMediaPriority(data: HarnessMediaInput) {
  const heroUrl = computed(() => data.heroVideoUrl || data.heroImageUrl);

  const mediaPriority = inject(
    mediaPriorityKey,
    computed(() => 'images' as MediaPriority),
  );
  const videosFirst = computed(() => mediaPriority.value === 'videos');

  return { heroUrl, videosFirst };
}
