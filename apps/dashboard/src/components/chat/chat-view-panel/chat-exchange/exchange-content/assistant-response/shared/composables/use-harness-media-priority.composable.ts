import { computed } from 'vue';

import { useAppStore } from '@/stores/app';
import { useConversationStore } from '@/stores/conversation';
import type { MediaPriority } from '@/types/harness-response-data.model';

/** The hero media fields the media-priority order depends on. */
export interface HarnessMediaInput {
  heroVideoUrl?: string;
  heroImageUrl?: string;
}

/**
 * Media ordering for harness responses: whether videos render before images
 * (or vice versa), driven by the active conversation's media-priority
 * preference (falling back to the app-level default). Also resolves the hero
 * media URL (video preferred over image).
 */
export function useHarnessMediaPriority(data: HarnessMediaInput) {
  const appStore = useAppStore();
  const conversationStore = useConversationStore();

  const heroUrl = computed(() => data.heroVideoUrl || data.heroImageUrl);

  const mediaPriority = computed<MediaPriority>(() =>
    appStore.getConversationMediaPriority(
      conversationStore.activeConversationId ?? '',
    ),
  );
  const videosFirst = computed(() => mediaPriority.value === 'videos');

  return { heroUrl, videosFirst };
}
