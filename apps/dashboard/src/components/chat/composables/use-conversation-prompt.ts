import type TurndownService from 'turndown';

import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { mapExchangeToMessage } from '@/stores/chat/conversation/helpers/map-exchange-to-message.helper';

let turndownPromise: Promise<TurndownService> | null = null;

function loadTurndown(): Promise<TurndownService> {
  if (!turndownPromise) {
    turndownPromise = import('turndown').then(
      ({ default: TurndownService }) =>
        new TurndownService({
          headingStyle: 'atx',
          codeBlockStyle: 'fenced',
        }),
    );
  }
  return turndownPromise;
}

interface ConversationPrompt {
  buildPrompt: (conversationStoreId: string) => Promise<string>;
}

/** Build prompts on demand, owning the shared lazy Turndown instance. */
export function useConversationPrompt(): ConversationPrompt {
  const conversationStore = useConversationStore();

  async function buildPrompt(conversationStoreId: string): Promise<string> {
    const conversation = conversationStore.getConversation(conversationStoreId);
    if (!conversation) return '[]';
    const turndown = await loadTurndown();
    const messages = conversation.exchanges
      .filter((exchange) => exchange.included !== false)
      .map((exchange) => mapExchangeToMessage(exchange, turndown))
      .filter(
        (message) =>
          message.role !== 'assistant' ||
          (message.content && message.content.trim().length > 0),
      );
    return JSON.stringify(messages);
  }

  return { buildPrompt };
}
