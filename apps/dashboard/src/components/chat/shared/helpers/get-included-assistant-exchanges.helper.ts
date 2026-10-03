import type { TokenBearingExchange } from './calc-total-context-percentage.helper.types';

/** The included (done, non-excluded) assistant exchanges that occupy the context window. */
export function getIncludedAssistantExchanges(
  exchanges: TokenBearingExchange[],
): TokenBearingExchange[] {
  return exchanges.filter(
    (e) =>
      e.role === 'assistant' && e.status === 'done' && e.included !== false,
  );
}
