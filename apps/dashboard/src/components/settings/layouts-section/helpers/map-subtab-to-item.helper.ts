import type { LucideIcon } from '@lucide/vue';

/** Build one subtab item from its config and the EODHD availability. */
export function mapSubtabToItem(
  subtab: { id: string; labelKey: string; icon: LucideIcon },
  eodhdEnabled: boolean,
  t: (key: string) => string,
) {
  const isStockmarket = subtab.id === 'stockmarket';
  const muted = isStockmarket && !eodhdEnabled;
  return {
    id: subtab.id,
    label: t(subtab.labelKey),
    icon: subtab.icon,
    muted,
    tooltip: muted ? t('common.stockmarketRequiresEodhd') : undefined,
  };
}
