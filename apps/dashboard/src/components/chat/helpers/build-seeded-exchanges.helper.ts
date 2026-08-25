import type { Exchange } from '@/stores/conversation';

import type { SeededExchangesOptions } from './build-seeded-exchanges.helper.types';

/**
 * Build the exchange pair seeded when a request is submitted: the user's
 * prompt (only when non-empty) followed by the pending assistant placeholder
 * the stream updates in place. Applied to the active conversation and to
 * every other conversation subscribed to the same event.
 */
export function buildSeededExchanges(
  options: SeededExchangesOptions,
): Array<Omit<Exchange, 'timestamp' | 'id'>> {
  const {
    requestId,
    model,
    event,
    roomId,
    conversationId,
    userContent,
    images,
    documents,
    mergeOrigin,
  } = options;
  const exchanges: Array<Omit<Exchange, 'timestamp' | 'id'>> = [];

  // A merge submit seeds the user bubble even without typed text so its
  // "Merged | <tags>" marker always shows; plain submits only seed when
  // there is something to display.
  if (userContent || mergeOrigin?.length) {
    exchanges.push({
      role: 'user',
      content: userContent,
      requestId,
      status: 'done',
      model,
      event,
      roomId,
      conversationId,
      images,
      documents,
      mergeOrigin,
    });
  }

  exchanges.push({
    role: 'assistant',
    content: '',
    requestId,
    status: 'pending',
    model,
    event,
    roomId,
    conversationId,
  });

  return exchanges;
}
