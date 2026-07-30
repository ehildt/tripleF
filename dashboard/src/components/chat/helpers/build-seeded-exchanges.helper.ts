import type { Exchange } from '@/stores/conversation';
import type { ConversationMetadataImage } from '@/utils/build-query-params.helper';

export interface SeededExchangesOptions {
  requestId: string;
  model: string;
  event: string;
  roomId: string;
  conversationId: string;
  userContent: string;
  images: ConversationMetadataImage[];
}

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
  } = options;
  const exchanges: Array<Omit<Exchange, 'timestamp' | 'id'>> = [];

  if (userContent) {
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
