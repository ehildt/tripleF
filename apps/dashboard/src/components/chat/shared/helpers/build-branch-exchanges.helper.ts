import type { Exchange } from '@/stores/conversation';

import { createId } from '../../../../utils/id.helper';

/**
 * Build the list of exchanges for a new branched conversation, copying the
 * hovered user exchange (and its assistant partner, if it shares the same
 * `requestId`) into fresh ids.
 */
export function buildBranchExchanges(
  userExchange: Exchange,
  partnerAssistant: Exchange | undefined,
): Exchange[] {
  const newRequestId = createId();
  const result: Exchange[] = [
    {
      ...userExchange,
      id: createId(),
      requestId: newRequestId,
      timestamp: Date.now(),
      status: 'done',
    },
  ];

  if (
    partnerAssistant?.role === 'assistant' &&
    partnerAssistant.requestId === userExchange.requestId
  ) {
    result.push({
      ...partnerAssistant,
      id: createId(),
      requestId: newRequestId,
      timestamp: Date.now(),
      toolCalls: undefined,
      status: 'done',
    });
  }

  return result;
}
