import type { Exchange } from '@/stores/conversation';

import { calcTotalContextPercentage } from '../../../shared/helpers/calc-token-percent.helper';

/**
 * Format context usage as a human-readable percentage string.
 * Returns "--" when no token data is available (exchange still in flight,
 * or no completed assistant exchange with token counts yet).
 */
export function formatContextUsagePercent(
  exchanges: Exchange[],
  numCtx: string,
): string {
  const percent = calcTotalContextPercentage(exchanges, numCtx);
  return percent !== null ? `${percent}%` : '--';
}
