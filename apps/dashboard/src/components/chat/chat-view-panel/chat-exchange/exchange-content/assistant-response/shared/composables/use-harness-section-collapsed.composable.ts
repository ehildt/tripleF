import { computed } from 'vue';

import { useAppStore } from '@/stores/app';
import type { CollapsibleSectionKey } from '@/types/harness-response-data.model';

/**
 * Whether a response section type is collapsed from the prompt bar (stored
 * in the app store, seeded expanded).
 */
export function useHarnessSectionCollapsed(section: CollapsibleSectionKey) {
  const appStore = useAppStore();
  return computed(() => appStore.collapsedSections[section]);
}
