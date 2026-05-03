import type { Exchange } from '@/stores/conversation';

/**
 * Compute the set of exchange ids that should render collapsed.
 *
 * A user exchange with `included === false` collapses itself and the
 * following assistant exchange (when it shares the same `requestId`).
 */
export function computeCollapsedExchangeIds(
  exchanges: readonly Exchange[],
): Set<string> {
  const result = new Set<string>();
  for (let i = 0; i < exchanges.length; i++) {
    const current = exchanges[i];
    if (current.role === 'user' && current.included === false) {
      result.add(current.id);
      const next = exchanges[i + 1];
      if (next?.role === 'assistant' && next.requestId === current.requestId) {
        result.add(next.id);
      }
    }
  }
  return result;
}
