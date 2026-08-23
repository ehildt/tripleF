import {
  Activity,
  BarChart3,
  Building2,
  Gauge,
  type LucideIcon,
  Newspaper,
  Search,
  TrendingUp,
} from '@lucide/vue';

import { i18n } from '@/i18n/i18n';

import type { EodhdCapabilities } from '../../sysctl-config.model';
import type { EodhdSourceStatus } from './build-eodhd-source-status.helper.types';

const EODHD_ENDPOINT_NAMES = [
  'search',
  'quote',
  'history',
  'technical',
  'intraday',
  'news',
  'fundamentals',
] as const;

type EodhdEndpointKey = (typeof EODHD_ENDPOINT_NAMES)[number];

/** Per-endpoint glyphs, shared by the status list and the endpoint cards. */
export const EODHD_ENDPOINT_ICONS: Record<string, LucideIcon> = {
  search: Search,
  quote: Activity,
  history: TrendingUp,
  technical: Gauge,
  intraday: BarChart3,
  news: Newspaper,
  fundamentals: Building2,
};

const EODHD_ENDPOINT_LABELS: Record<EodhdEndpointKey, string> = {
  search: 'common.eodhdSearchDesc',
  quote: 'common.eodhdQuoteDesc',
  history: 'common.eodhdHistoryDesc',
  technical: 'common.eodhdTechnicalDesc',
  intraday: 'common.eodhdIntradayDesc',
  news: 'common.eodhdNewsDesc',
  fundamentals: 'common.eodhdFundamentalsDesc',
};

/**
 * The EODHD endpoint availability list for the capabilities panel, sorted so
 * available endpoints come first. Empty when the provider has not been
 * probed yet (no capabilities snapshot).
 */
export function buildEodhdSourceStatus(
  capabilities: EodhdCapabilities | undefined,
): EodhdSourceStatus[] {
  const endpoints = capabilities?.endpoints;
  if (!endpoints) return [];
  const statuses: EodhdSourceStatus[] = [];
  for (const key of EODHD_ENDPOINT_NAMES) {
    statuses.push({
      key,
      label: i18n.global.t(EODHD_ENDPOINT_LABELS[key]),
      available: endpoints[key] === true,
      icon: EODHD_ENDPOINT_ICONS[key],
    });
  }
  return statuses.sort((a, b) => Number(b.available) - Number(a.available));
}
