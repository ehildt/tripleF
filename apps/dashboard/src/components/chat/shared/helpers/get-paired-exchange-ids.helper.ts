import type { Exchange } from '@/stores/conversation';

/**
 * Resolve the exchange ids that form one logical unit with the given
 * exchange: the user prompt and its paired assistant response sharing the
 * same request id (forward pairing wins over backward, matching the
 * submit-seeded layout). Returns `null` when the id is not found.
 */
export function getPairedExchangeIds(
  exchanges: readonly Exchange[],
  exchangeId: string,
): [string, string] | null {
  const index = exchanges.findIndex((e) => e.id === exchangeId);
  if (index === -1) return null;

  const target = exchanges[index];
  let partnerIndex: number | null = null;
  if (
    index < exchanges.length - 1 &&
    exchanges[index + 1].requestId === target.requestId
  ) {
    partnerIndex = index + 1;
  } else if (index > 0 && exchanges[index - 1].requestId === target.requestId) {
    partnerIndex = index - 1;
  }

  if (partnerIndex === null) return [target.id, target.id];
  return partnerIndex < index
    ? [exchanges[partnerIndex].id, target.id]
    : [target.id, exchanges[partnerIndex].id];
}
