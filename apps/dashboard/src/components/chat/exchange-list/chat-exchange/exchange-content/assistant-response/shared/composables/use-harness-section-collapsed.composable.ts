import { computed, inject } from 'vue';

import type {
  CollapsedSections,
  CollapsibleSectionKey,
} from '@/types/harness-response-data.model';
import { sectionCollapsedKey } from '@/types/harness-response-data.model';

const DEFAULT_EXPANDED_SECTIONS: CollapsedSections = {
  sources: false,
  keyFindings: false,
  internationalCoverage: false,
};

/**
 * Whether a response section type is collapsed from the prompt bar. Falls
 * back to expanded (false) when no provider is present (stories, standalone
 * mounts), so sections render normally outside the chat orchestrator.
 */
export function useHarnessSectionCollapsed(section: CollapsibleSectionKey) {
  const collapsedSections = inject(
    sectionCollapsedKey,
    computed(() => DEFAULT_EXPANDED_SECTIONS),
  );
  return computed(() => collapsedSections.value[section]);
}
