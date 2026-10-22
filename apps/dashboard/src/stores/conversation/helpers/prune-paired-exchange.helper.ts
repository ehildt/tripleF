import type { Exchange } from '../conversation.model';

/**
 * Remove an exchange, and when it is a user prompt immediately followed by
 * its paired assistant response (same request id), remove both as one
 * logical unit. Returns the original array when the id is not found so the
 * caller can skip persistence.
 */
export function prunePairedExchange(
  exchanges: Exchange[],
  exchangeId: string,
): Exchange[] {
  const index = exchanges.findIndex((e) => e.id === exchangeId);
  if (index === -1) return exchanges;

  const next = exchanges[index + 1];
  if (
    next?.role === 'assistant' &&
    next.requestId === exchanges[index].requestId
  ) {
    return exchanges.filter((_, i) => i !== index && i !== index + 1);
  }

  return exchanges.filter((_, i) => i !== index);
}
