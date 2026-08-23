import type { Exchange } from '@/stores/conversation';

/**
 * Compute the set of exchange ids that should render highlighted when a
 * user is hovering a delete button.
 *
 * The hovered exchange is always highlighted, and the immediately following
 * assistant exchange (when it shares the same `requestId`) is highlighted too
 * so both can be deleted together.
 */
export function computeHighlightedExchangeIds(
  exchanges: readonly Exchange[],
  hoveredDeleteId: string | null,
): Set<string> {
  const result = new Set<string>();
  if (!hoveredDeleteId) return result;
  const idx = exchanges.findIndex((e) => e.id === hoveredDeleteId);
  if (idx === -1) return result;
  result.add(hoveredDeleteId);
  const next = exchanges[idx + 1];
  if (
    next?.role === 'assistant' &&
    next.requestId === exchanges[idx].requestId
  ) {
    result.add(next.id);
  }
  return result;
}
