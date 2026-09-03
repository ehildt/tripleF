import { Activity, Clock, Wallet } from '@lucide/vue';

import { i18n } from '@/i18n/i18n';

import type { BrightDataCapabilities } from '../../sysctl-config.model';
import type { CapabilityRow } from '../shared/ui/capabilities-panel/CapabilitiesPanel.types';

/**
 * Bright Data account/usage metadata rows for the capabilities panel. Empty
 * when the provider has not been probed yet. A balance permission error is
 * surfaced as a warning row instead of the numeric balance.
 */
export function buildBrightDataCapabilityRows(
  capabilities: BrightDataCapabilities | undefined,
): CapabilityRow[] {
  if (!capabilities) return [];
  const rows: CapabilityRow[] = [
    {
      icon: Activity,
      label: i18n.global.t('common.brightDataStatus'),
      value: capabilities.status ?? '—',
    },
  ];
  if (capabilities.balanceError) {
    rows.push({
      icon: Wallet,
      label: i18n.global.t('common.brightDataBalance'),
      value: i18n.global.t('common.brightDataBalancePermission'),
      tone: 'warning' as const,
    });
  } else {
    rows.push({
      icon: Wallet,
      label: i18n.global.t('common.brightDataBalance'),
      value:
        capabilities.balance != null
          ? `$${capabilities.balance.toFixed(2)}`
          : '—',
    });
    if (capabilities.pendingCosts != null) {
      rows.push({
        icon: Clock,
        label: i18n.global.t('common.brightDataPending'),
        value: `$${capabilities.pendingCosts.toFixed(2)}`,
      });
    }
  }
  return rows;
}
