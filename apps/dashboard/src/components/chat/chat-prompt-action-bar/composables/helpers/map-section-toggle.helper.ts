import type { LucideIcon } from '@lucide/vue';

import type {
  CollapsedSections,
  CollapsibleSectionKey,
} from '@/types/harness-response-data.model';

/** A response-section toggle: its type and leading icon. */
type SectionToggleConfig = {
  key: CollapsibleSectionKey;
  icon: LucideIcon;
};

/** A resolved section toggle, ready for the caller to translate. */
type SectionToggleData = {
  key: CollapsibleSectionKey;
  icon: LucideIcon;
  hidden: boolean;
  titleKey: string;
};

/** Build one section toggle from its config and the current collapse state:
 * pick the show/hide title key. Translation happens in the caller. */
export function mapSectionToggle(
  config: SectionToggleConfig,
  collapsedSections: CollapsedSections,
): SectionToggleData {
  const { key, icon } = config;
  const hidden = collapsedSections[key];
  return {
    key,
    icon,
    hidden,
    titleKey: hidden
      ? 'common.showSectionWithName'
      : 'common.hideSectionWithName',
  };
}
