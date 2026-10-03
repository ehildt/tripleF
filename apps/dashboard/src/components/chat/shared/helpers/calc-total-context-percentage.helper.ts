import { calcCurrentContextTokens } from './calc-current-context-tokens.helper';
import type { TokenBearingExchange } from './calc-total-context-percentage.helper.types';

/**
 * Calculate the total percentage of the context window used by the
 * conversation. Returns null when no token data is available or numCtx is
 * invalid.
 *
 * Sums non-cumulative inputTokenDelta + evalCount for all included assistant
 * exchanges. Excluded turns are automatically skipped via getIncludedAssistantExchanges.
 *
 * Returns a string formatted with two decimal places (e.g. "7.00").
 */
export function calcTotalContextPercentage(
  exchanges: TokenBearingExchange[],
  numCtx: string,
): string | null {
  const ctx = Number(numCtx ?? 0);
  if (!ctx) return null;

  const total = calcCurrentContextTokens(exchanges);
  if (total === null) return null;

  const percent = Math.min(100, (total / ctx) * 100);
  return `${percent.toFixed(2)}`;
}
