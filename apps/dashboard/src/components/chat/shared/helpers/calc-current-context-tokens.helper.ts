import type { TokenBearingExchange } from './calc-total-context-percentage.helper.types';
import { deriveInputTokenDelta } from './derive-input-token-delta.helper';
import { getIncludedAssistantExchanges } from './get-included-assistant-exchanges.helper';

/**
 * Calculate the current number of tokens occupying the context window.
 *
 * Sums inputTokenDelta and evalCount for all included assistant exchanges.
 * These are non-cumulative per-turn values so excluding an exchange simply
 * removes its own contribution from the total. Turns whose stored
 * `inputTokenDelta` is missing fall back to a `promptEvalCount`-derived
 * estimate (see `deriveInputTokenDelta`).
 *
 * Returns null when no completed assistant exchange has token data.
 */
export function calcCurrentContextTokens(
  exchanges: TokenBearingExchange[],
): number | null {
  const included = getIncludedAssistantExchanges(exchanges);
  if (!included.length) return null;

  let total = 0;
  let hasTokenData = false;
  let prev: TokenBearingExchange | undefined;
  for (const a of exchanges) {
    if (a.role !== 'assistant' || a.status !== 'done') continue;

    const input = deriveInputTokenDelta(prev, a);
    if (a.included !== false) {
      if (input != null || a.evalCount != null) {
        hasTokenData = true;
        total += (input ?? 0) + (a.evalCount ?? 0);
      }
    }
    prev = a;
  }
  // A completed assistant with no token data yet (e.g. a non-streamed
  // response before stats arrive) must not read as 0% — return null so the
  // caller hides the percentage until it can actually be calculated.
  return hasTokenData ? total : null;
}
