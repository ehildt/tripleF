import type { TokenBearingExchange } from './calc-total-context-percentage.helper.types';

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
export function deriveInputTokenDelta(
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
