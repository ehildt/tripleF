import { EODHD_FREE_PLAN_DAILY_LIMIT } from '../../constants/provider-overrides.constants.js';

/**
 * Human-readable plan label inferred from the daily quota — 'Free' at or
 * under the free-plan limit, otherwise the quota itself.
 */
export function deriveEodhdPlan(dailyRateLimit?: number): string | undefined {
  if (!dailyRateLimit) return undefined;
  if (dailyRateLimit <= EODHD_FREE_PLAN_DAILY_LIMIT) return 'Free';
  return `${dailyRateLimit.toLocaleString()} calls / day`;
}
