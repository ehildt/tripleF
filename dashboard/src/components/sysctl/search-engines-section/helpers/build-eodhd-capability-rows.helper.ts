import { Activity, BadgeCheck, Coins, Gauge, Sparkles } from '@lucide/vue';

import { i18n } from '@/i18n/i18n';

import type { CapabilityRow } from '../../shared/ui/capabilities-panel/CapabilitiesPanel.types';
import type { EodhdCapabilities } from '../../sysctl-config.model';

/**
 * EODHD plan/usage metadata rows for the capabilities panel. Empty when the
 * provider has not been probed yet (no capabilities snapshot).
 */
export function buildEodhdCapabilityRows(
  capabilities: EodhdCapabilities | undefined,
): CapabilityRow[] {
  if (!capabilities) return [];
  const quotaRemaining =
    capabilities.dailyRateLimit != null && capabilities.apiRequests != null
      ? Math.max(0, capabilities.dailyRateLimit - capabilities.apiRequests)
      : undefined;
  const rows: CapabilityRow[] = [
    {
      icon: BadgeCheck,
      label: i18n.global.t('common.eodhdPlan'),
      value: capabilities.plan ?? '—',
    },
    {
      icon: Gauge,
      label: i18n.global.t('common.eodhdDailyLimit'),
      value: capabilities.dailyRateLimit?.toLocaleString() ?? '—',
    },
    {
      icon: Activity,
      label: i18n.global.t('common.eodhdCallsUsed'),
      value: capabilities.apiRequests?.toLocaleString() ?? '—',
    },
    {
      icon: Coins,
      label: i18n.global.t('common.eodhdQuotaRemaining'),
      value: quotaRemaining?.toLocaleString() ?? '—',
    },
  ];
  if (capabilities.extraLimit != null) {
    rows.push({
      icon: Sparkles,
      label: i18n.global.t('common.eodhdExtraCalls'),
      value: capabilities.extraLimit.toLocaleString(),
    });
  }
  return rows;
}
