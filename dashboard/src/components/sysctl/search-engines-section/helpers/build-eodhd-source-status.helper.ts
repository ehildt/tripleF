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

const EODHD_ENDPOINT_LABELS: Record<
  (typeof EODHD_ENDPOINT_NAMES)[number],
  string
> = {
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
  return EODHD_ENDPOINT_NAMES.map((key) => ({
    key,
    label: i18n.global.t(EODHD_ENDPOINT_LABELS[key]),
    available: endpoints[key] === true,
  })).sort((a, b) => Number(b.available) - Number(a.available));
}
