import type { LucideIcon } from '@lucide/vue';

import type { CollapsibleSectionKey } from '@/types/harness-response-data.model';

type Translate = (key: string, params?: Record<string, unknown>) => string;

/** Build one section toggle from its config and current hidden state. */
export function mapSectionToggle(
  {
    key,
    icon,
    labelKey,
  }: {
    key: CollapsibleSectionKey;
    icon: LucideIcon;
    labelKey: string;
  },
  collapsedSections: Record<CollapsibleSectionKey, boolean>,
  t: Translate,
) {
  const hidden = collapsedSections[key];
  const name = t(labelKey);
  return {
    key,
    icon,
    hidden,
    title: hidden
      ? t('common.showSectionWithName', { section: name })
      : t('common.hideSectionWithName', { section: name }),
  };
}
