import type { Exchange } from '@/stores/conversation';

/**
 * Compute the set of exchange ids that should render collapsed.
 *
 * A user exchange with `included === false` collapses itself and the
 * following assistant exchange (when it shares the same `requestId`) —
 * unless it was consumed by a completed merge (`mergedInto`), which keeps
 * the section fully visible with its purple merged styling.
 */
export function computeCollapsedExchangeIds(
  exchanges: readonly Exchange[],
): Set<string> {
  const result = new Set<string>();
  for (let i = 0; i < exchanges.length; i++) {
    const current = exchanges[i];
    if (
      current.role === 'user' &&
      current.included === false &&
      current.mergedInto == null
    ) {
      result.add(current.id);
      const next = exchanges[i + 1];
      if (next?.role === 'assistant' && next.requestId === current.requestId) {
        result.add(next.id);
      }
    }
  }
  return result;
}
