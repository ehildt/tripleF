import type { TokenBearingExchange } from './calc-token-percent.helper.types';

function getIncludedAssistantExchanges(
  exchanges: TokenBearingExchange[],
): TokenBearingExchange[] {
  return exchanges.filter(
    (e) =>
      e.role === 'assistant' && e.status === 'done' && e.included !== false,
  );
}

/**
 * Non-cumulative input tokens contributed by a single done assistant turn.
 *
 * Prefers the stored non-cumulative `inputTokenDelta` (written at save time
 * by the store). When it is missing — legacy conversations, or a turn whose
 * stats were persisted before the delta was computed — the cumulative
 * `promptEvalCount` is used instead, mirroring the save-time math in
 * `calcInputTokenDelta`: the previous done assistant's cumulative count and
 * output tokens are subtracted. The previous assistant is the immediately
 * preceding done one (included or not) because its response may or may not
 * have been part of the prompt the model actually saw, and the cumulative
 * count already reflects that truth.
 *
 * Returns null when neither source of input-token data exists.
 */
function deriveInputTokenDelta(
  prev: TokenBearingExchange | undefined,
  assistant: TokenBearingExchange,
): number | null {
  if (assistant.inputTokenDelta != null) return assistant.inputTokenDelta;
  if (assistant.promptEvalCount == null) return null;

  const cumulativeDelta = !prev
    ? assistant.promptEvalCount
    : Math.max(0, assistant.promptEvalCount - (prev.promptEvalCount ?? 0));
  return prev && prev.evalCount != null
    ? Math.max(0, cumulativeDelta - prev.evalCount)
    : cumulativeDelta;
}

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

/**
 * Calculate the incremental token contribution of a single assistant exchange.
 *
 * Uses the pre-computed inputTokenDelta (non-cumulative inputs for this turn)
 * plus evalCount (turn output), falling back to a promptEvalCount-derived
 * estimate when the stored delta is missing. Returns null when the exchange
 * has no token data.
 */
export function calcAssistantExchangeContribution(
  exchanges: TokenBearingExchange[],
  targetAssistant: TokenBearingExchange,
): number | null {
  const included = getIncludedAssistantExchanges(exchanges);
  if (!included.some((a) => a.id === targetAssistant.id)) return null;

  let prev: TokenBearingExchange | undefined;
  for (const a of exchanges) {
    if (a.role !== 'assistant' || a.status !== 'done') continue;
    if (a.id === targetAssistant.id) {
      const input = deriveInputTokenDelta(prev, a);
      return input != null || a.evalCount != null
        ? (input ?? 0) + (a.evalCount ?? 0)
        : null;
    }
    prev = a;
  }
  return null;
}

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
