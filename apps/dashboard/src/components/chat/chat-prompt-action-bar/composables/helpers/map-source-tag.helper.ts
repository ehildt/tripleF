import { type LucideIcon, Search } from '@lucide/vue';

type SourceMeta = Record<string, { icon: LucideIcon; label: string }>;

/** A toggleable search source: its key plus on/off state. */
type SourceTagInput = {
  key: string;
  enabled: boolean;
};

/** A resolved search-source tag, ready for the caller to translate. */
type SourceTagData = {
  key: string;
  enabled: boolean;
  icon: LucideIcon;
  label: string;
  titleKey: string;
};

/** Build one search-source tag from its config: resolve the icon and label
 * (falling back to Search and the raw key for unknown sources) and pick the
 * enabled/disabled title key. Translation happens in the caller. */
export function mapSourceTag(
  sourceTag: SourceTagInput,
  sourceMeta: SourceMeta,
): SourceTagData {
  const { key, enabled } = sourceTag;
  const label = sourceMeta[key]?.label ?? key;
  const icon = sourceMeta[key]?.icon ?? Search;
  return {
    key,
    enabled,
    icon,
    label,
    titleKey: enabled ? 'common.sourceEnabled' : 'common.sourceDisabled',
  };
}
