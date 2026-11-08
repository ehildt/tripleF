import { computed } from 'vue';

import { useAssistantResponseSettingsStore } from '@/stores/chat/assistant-response-settings/assistant-response-settings.store';
import type { MediaPresentation } from '@/types/assistant-response-data.model';

/**
 * The presentation a media section renders in (gallery or list), driven by
 * the prompt bar's view menu (stored in the assistant-response settings store,
 * seeded with image → gallery, video → list defaults).
 */
export function useResponseMediaPresentation(media: 'image' | 'video') {
  const assistantResponseSettingsStore = useAssistantResponseSettingsStore();
  return computed<MediaPresentation>(
    () => assistantResponseSettingsStore.mediaPresentations[media],
  );
}
