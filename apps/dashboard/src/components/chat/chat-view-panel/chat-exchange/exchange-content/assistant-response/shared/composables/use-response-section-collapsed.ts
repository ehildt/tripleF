import { computed } from 'vue';

import { useAppStore } from '@/stores/app/app.store';
import type { CollapsibleSectionKey } from '@/types/assistant-response-data.model';

/**
 * Whether a response section type is collapsed from the prompt bar (stored
 * in the app store, seeded expanded).
 */
export function useResponseSectionCollapsed(section: CollapsibleSectionKey) {
  const appStore = useAppStore();
  return computed(() => appStore.collapsedSections[section]);
}
