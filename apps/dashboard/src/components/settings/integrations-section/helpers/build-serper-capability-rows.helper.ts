import { Coins, Gauge } from '@lucide/vue';

import { i18n } from '@/i18n/i18n';

import type { SerperCapabilities } from '../../settings-config.model';
import type { CapabilityRow } from '../shared/ui/capabilities-panel/CapabilitiesPanel.types';

/**
 * Serper account/usage metadata rows for the capabilities panel. Empty when
 * the provider has not been probed yet (no capabilities snapshot).
 */
export function buildSerperCapabilityRows(
  capabilities: SerperCapabilities | undefined,
): CapabilityRow[] {
  if (!capabilities) return [];
  return [
    {
      icon: Coins,
      label: i18n.global.t('common.serperCreditsRemaining'),
      value: capabilities.remainingCredits?.toLocaleString() ?? '—',
    },
    {
      icon: Gauge,
      label: i18n.global.t('common.serperRateLimit'),
      value:
        capabilities.rateLimit != null ? String(capabilities.rateLimit) : '—',
    },
  ];
}
