import { computed } from 'vue';

import { useAssistantResponseSettingsStore } from '@/stores/chat/assistant-response-settings/assistant-response-settings.store';
import type { CollapsibleSectionKey } from '@/types/assistant-response-data.model';

/**
 * Whether a response section type is collapsed from the prompt bar (stored
 * in the assistant-response settings store, seeded expanded).
 */
export function useResponseSectionCollapsed(section: CollapsibleSectionKey) {
  const assistantResponseSettingsStore = useAssistantResponseSettingsStore();
  return computed(
    () => assistantResponseSettingsStore.collapsedSections[section],
  );
}
