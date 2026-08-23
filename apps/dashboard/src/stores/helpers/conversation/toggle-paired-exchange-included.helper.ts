import type { Exchange } from '../../conversation.model';

/**
 * Toggle an exchange's prompt inclusion together with its paired partner:
 * the assistant response following a user prompt (or the user prompt
 * preceding an assistant response) sharing the same request id, so both
 * halves are always included or excluded together. Forward pairing wins
 * over backward pairing, matching the submit-seeded layout. Returns `null`
 * when the id is not found so the caller can skip persistence.
 */
export function togglePairedExchangeIncluded(
  exchanges: Exchange[],
  exchangeId: string,
): Exchange[] | null {
  const index = exchanges.findIndex((e) => e.id === exchangeId);
  if (index === -1) return null;

  const target = exchanges[index];
  const newIncluded = target.included !== false ? false : true;

  let partnerIndex: number | null = null;
  if (
    index < exchanges.length - 1 &&
    exchanges[index + 1].requestId === target.requestId
  ) {
    partnerIndex = index + 1;
  } else if (index > 0 && exchanges[index - 1].requestId === target.requestId) {
    partnerIndex = index - 1;
  }

  return exchanges.map((exchange, i) =>
    i === index || i === partnerIndex
      ? { ...exchange, included: newIncluded }
      : exchange,
  );
}
