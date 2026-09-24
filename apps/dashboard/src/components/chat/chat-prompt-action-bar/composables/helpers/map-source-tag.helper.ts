import { type LucideIcon, Search } from '@lucide/vue';

type Translate = (key: string, params?: Record<string, unknown>) => string;

/** Build one search-source tag from its config. */
export function mapSourceTag(
  { key, enabled }: { key: string; enabled: boolean },
  sourceMeta: Record<string, { icon: LucideIcon; label: string }>,
  t: Translate,
) {
  const label = sourceMeta[key]?.label ?? key;
  return {
    key,
    enabled,
    // Unknown sources fall back to a distinct Search icon — never one of
    // the mapped icons, so the tags never repeat.
    icon: sourceMeta[key]?.icon ?? Search,
    label,
    title: enabled
      ? t('common.sourceEnabled', { label })
      : t('common.sourceDisabled', { label }),
  };
}
