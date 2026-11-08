import { computed } from 'vue';

import { useAssistantResponseSettingsStore } from '@/stores/chat/assistant-response-settings/assistant-response-settings.store';
import { useConversationStore } from '@/stores/conversation/conversation.store';
import type { MediaPriority } from '@/types/assistant-response-data.model';

/** The hero media fields the media-priority order depends on. */
export interface AssistantMediaInput {
  heroVideoUrl?: string;
  heroImageUrl?: string;
}

/**
 * Media ordering for harness responses: whether videos render before images
 * (or vice versa), driven by the active conversation's media-priority
 * preference (falling back to the app-level default). Also resolves the hero
 * media URL (video preferred over image).
 */
export function useResponseMediaPriority(data: AssistantMediaInput) {
  const assistantResponseSettingsStore = useAssistantResponseSettingsStore();
  const conversationStore = useConversationStore();

  const heroUrl = computed(() => data.heroVideoUrl || data.heroImageUrl);

  const mediaPriority = computed<MediaPriority>(() =>
    assistantResponseSettingsStore.getConversationMediaPriority(
      conversationStore.activeConversationId ?? '',
    ),
  );
  const videosFirst = computed(() => mediaPriority.value === 'videos');

  return { heroUrl, videosFirst };
}
