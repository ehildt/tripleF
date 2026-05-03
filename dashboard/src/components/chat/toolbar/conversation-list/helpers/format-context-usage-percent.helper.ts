import type { Exchange } from '@/stores/conversation';

import { calcTokenPercent } from '../../../shared/helpers/calc-token-percent.helper';

/**
 * Format context usage as a human-readable percentage string.
 * Returns "0%" when no token data is available.
 */
export function formatContextUsagePercent(
  exchanges: Exchange[],
  numCtx: string,
): string {
  const percent = calcTokenPercent(exchanges, numCtx);
  return percent !== null ? `${percent}%` : '0%';
}
