import type { Conversation } from '@/stores/chat/conversation/conversation.model';

import type { MergedSourceExchanges } from './resolve-merged-source-exchanges.helper.types';

/** Resolve the source requests and exchange ids consumed by a merged turn. */
export function resolveMergedSourceExchanges(
  conversation: Conversation,
  requestId: string,
): MergedSourceExchanges | null {
  const pairUser = conversation.exchanges.find(
    (exchange) => exchange.role === 'user' && exchange.requestId === requestId,
  );
  if (!pairUser?.mergeOrigin?.length) return null;

  const originRequestIds = [...pairUser.mergeOrigin];
  const origins = new Set(originRequestIds);
  const sourceExchangeIds = conversation.exchanges
    .filter((exchange) => exchange.requestId && origins.has(exchange.requestId))
    .map((exchange) => exchange.id);
  return { originRequestIds, sourceExchangeIds };
}
