interface TokenBearingExchange {
  id?: string;
  role: string;
  status: string;
  included?: boolean;
  promptEvalCount?: number;
  evalCount?: number;
  inputTokenDelta?: number;
}

function getIncludedAssistantExchanges(
  exchanges: TokenBearingExchange[],
): TokenBearingExchange[] {
  return exchanges.filter(
    (e) =>
      e.role === 'assistant' && e.status === 'done' && e.included !== false,
  );
}

/**
 * Calculate the current number of tokens occupying the context window.
 *
 * Sums inputTokenDelta and evalCount for all included assistant exchanges.
 * These are non-cumulative per-turn values so excluding an exchange simply
 * removes its own contribution from the total.
 *
 * Returns null when no completed assistant exchange has token data.
 */
export function calcCurrentContextTokens(
  exchanges: TokenBearingExchange[],
): number | null {
  const assistants = getIncludedAssistantExchanges(exchanges);
  if (!assistants.length) return null;

  let total = 0;
  for (const a of assistants) {
    if (a.inputTokenDelta != null || a.evalCount != null) {
      total += (a.inputTokenDelta ?? 0) + (a.evalCount ?? 0);
    }
  }
  return total;
}

/**
 * Calculate the incremental token contribution of a single assistant exchange.
 *
 * Uses the pre-computed inputTokenDelta (non-cumulative inputs for this turn)
 * plus evalCount (turn output). Returns null when the exchange has no token data.
 */
export function calcAssistantExchangeContribution(
  exchanges: TokenBearingExchange[],
  targetAssistant: TokenBearingExchange,
): number | null {
  const assistants = getIncludedAssistantExchanges(exchanges);
  const index = assistants.findIndex((a) => a.id === targetAssistant.id);
  if (index === -1) return null;

  const assistant = assistants[index];

  if (assistant.inputTokenDelta != null || assistant.evalCount != null)
    return (assistant.inputTokenDelta ?? 0) + (assistant.evalCount ?? 0);

  return null;
}

/**
 * Calculate the percentage of the context window used by a single user
 * prompt + response exchange. Returns null when numCtx is invalid or the
 * exchange has no token data.
 *
 * Returns a string formatted with two decimal places (e.g. "3.26").
 */
export function calcPromptContextPercentage(
  exchanges: TokenBearingExchange[],
  assistantExchange: TokenBearingExchange,
  numCtx: string,
): string | null {
  const ctx = Number(numCtx ?? 0);
  if (!ctx) return null;

  const contribution = calcAssistantExchangeContribution(
    exchanges,
    assistantExchange,
  );
  if (contribution === null) return null;

  const percent = Math.min(100, (contribution / ctx) * 100);
  return `${percent.toFixed(2)}`;
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
