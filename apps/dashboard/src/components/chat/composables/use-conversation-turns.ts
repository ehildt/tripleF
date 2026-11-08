import { buildAssistantRetryReset } from '@/components/chat/composables/helpers/build-assistant-retry-reset.helper';
import { useConversationCatalog } from '@/components/chat/composables/use-conversation-catalog';
import { useConversationPersistence } from '@/components/chat/composables/use-conversation-persistence';
import type { Conversation } from '@/stores/chat/conversation/conversation.model';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';

import type {
  ConversationRetryPreparation,
  ConversationTurnSeed,
} from './use-conversation-turns.types';

interface ConversationTurns {
  seedConversationTurn: (seed: ConversationTurnSeed) => Promise<void>;
  prepareConversationRetry: (
    preparation: ConversationRetryPreparation,
  ) => Promise<void>;
}

/** Own atomic turn seeding and retry preparation with one persistence command. */
export function useConversationTurns(): ConversationTurns {
  const conversationStore = useConversationStore();
  const catalog = useConversationCatalog();
  const persistence = useConversationPersistence();

  function write(
    conversationStoreId: string,
    mutation: (conversation: Conversation) => boolean,
  ): Promise<void> {
    const apply = (conversation: Conversation) => {
      if (!mutation(conversation)) return Promise.resolve();
      return persistence.persistConversation(conversation);
    };
    const current = conversationStore.getConversation(conversationStoreId);
    if (current?.loaded) return apply(current);
    return catalog
      .loadConversationForWrite(conversationStoreId)
      .then((conversation) => {
        if (conversation) return apply(conversation);
      });
  }

  function seedConversationTurn(seed: ConversationTurnSeed): Promise<void> {
    return write(seed.conversationStoreId, () => {
      for (const exchange of seed.exchanges) {
        conversationStore.addExchange(
          seed.conversationStoreId,
          exchange,
          seed.defaultTitle,
        );
      }
      if (seed.patchConfiguration) {
        conversationStore.patchConversation(seed.conversationStoreId, {
          model: seed.model,
          numCtx: seed.numCtx,
          think: seed.think,
          stream: seed.stream,
          event: seed.event,
          roomId: seed.roomId,
        });
      }
      return true;
    });
  }

  function prepareConversationRetry(
    preparation: ConversationRetryPreparation,
  ): Promise<void> {
    return write(preparation.conversationStoreId, (conversation) => {
      conversationStore.patchConversation(preparation.conversationStoreId, {
        model: preparation.model,
        event: preparation.event,
        roomId: preparation.roomId,
        numCtx: preparation.numCtx,
        think: preparation.think,
        stream: preparation.stream,
      });
      const metadata = {
        model: preparation.model,
        event: preparation.event,
        roomId: preparation.roomId,
      };
      const hasTurn = conversation.exchanges.some(
        (exchange) => exchange.requestId === preparation.requestId,
      );
      if (!hasTurn && preparation.failedPrompt !== undefined) {
        conversationStore.addExchange(
          preparation.conversationStoreId,
          {
            role: 'user',
            content: preparation.failedPrompt,
            requestId: preparation.requestId,
            status: 'done',
            ...metadata,
            conversationId: preparation.serverConversationId,
          },
          preparation.defaultTitle,
        );
      }
      const reset = conversationStore.patchAssistantExchange(
        preparation.conversationStoreId,
        preparation.requestId,
        buildAssistantRetryReset(metadata, conversation.conversationId),
        true,
      );
      if (!reset) {
        conversationStore.addExchange(
          preparation.conversationStoreId,
          {
            role: 'assistant',
            content: '',
            requestId: preparation.requestId,
            status: 'pending',
            ...metadata,
            conversationId: preparation.serverConversationId,
          },
          preparation.defaultTitle,
        );
      }
      conversationStore.touchConversation(preparation.conversationStoreId);
      return true;
    });
  }

  return {
    seedConversationTurn,
    prepareConversationRetry,
  };
}
