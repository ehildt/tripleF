interface ExchangeLike {
  role: 'user' | 'assistant';
  status: string;
  promptEvalCount?: number;
  evalCount?: number;
}

/**
 * Non-cumulative input tokens added by a specific turn. PEC is cumulative
 * and bakes in:
 *   1) new user input tokens
 *   2) the previous assistant's response (already counted in its evalCount)
 * We subtract the previous evalCount to avoid double-counting, leaving only
 * the *new* inputs actually added by this exchange.
 *
 * Expects the current exchange to already be marked done — the previous
 * assistant is therefore the second-to-last done assistant.
 */
export function calcInputTokenDelta(
  exchanges: ExchangeLike[],
  cumulativeInputs: number,
): number {
  const allAssistants = exchanges.filter(
    (e) => e.role === 'assistant' && e.status === 'done',
  );
  const prevAssistant = allAssistants.at(-2);

  let delta = !prevAssistant
    ? cumulativeInputs
    : Math.max(0, cumulativeInputs - (prevAssistant.promptEvalCount ?? 0));

  // Subtract previous response tokens — they were already counted in the
  // prior assistant's evalCount and only reappear here because Ollama
  // counts them as input on this call.
  if (prevAssistant && prevAssistant.evalCount != null) {
    delta = Math.max(0, delta - prevAssistant.evalCount);
  }
  return delta;
}
