interface TokenBearingExchange {
  role: string;
  status: string;
  included?: boolean;
  promptEvalCount?: number;
  evalCount?: number;
}

/**
 * Calculate the percentage of the context window used by the most recent
 * completed assistant exchange. Returns null when no token data is available
 * or numCtx is invalid.
 *
 * The latest done assistant's promptEvalCount already includes all prior
 * context, so summing across multiple assistant exchanges would double-count
 * the conversation history. We therefore use only the newest exchange that
 * carries token data and is still included in the context.
 */
export function calcTokenPercent(
  exchanges: TokenBearingExchange[],
  numCtx: string,
): number | null {
  const ctx = Number(numCtx ?? 0);
  if (!ctx) return null;

  for (let i = exchanges.length - 1; i >= 0; i--) {
    const ex = exchanges[i];
    if (ex.role !== 'assistant' || ex.status !== 'done') continue;
    if (ex.included === false) continue;

    const p = ex.promptEvalCount;
    const o = ex.evalCount;
    if (p != null || o != null) {
      return Math.round((((p ?? 0) + (o ?? 0)) / ctx) * 100);
    }
  }

  return null;
}
