import { buildAssistantCompletionPatch } from '@/components/chat/composables/helpers/build-assistant-completion-patch.helper';
import type { AssistantCompletionTokenData } from '@/components/chat/composables/helpers/build-assistant-completion-patch.helper.types';
import { resolveMergedSourceExchanges } from '@/components/chat/composables/helpers/resolve-merged-source-exchanges.helper';
import { useConversationCatalog } from '@/components/chat/composables/use-conversation-catalog';
import { useConversationPersistence } from '@/components/chat/composables/use-conversation-persistence';
import type { Conversation } from '@/stores/chat/conversation/conversation.model';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { useMergeSelectionStore } from '@/stores/merge-selection/merge-selection.store';

interface ConversationExchangeCompletion {
  markExchangeDone: (
    conversationStoreId: string,
    requestId: string,
    tokenData?: AssistantCompletionTokenData,
  ) => Promise<void>;
  markExchangeError: (
    conversationStoreId: string,
    requestId: string,
    errorMessage?: string,
  ) => Promise<void>;
}

/** Own terminal exchange transitions, merge resolution, and persistence. */
export function useConversationExchangeCompletion(): ConversationExchangeCompletion {
  const conversationStore = useConversationStore();
  const mergeSelectionStore = useMergeSelectionStore();
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

  function markExchangeDone(
    conversationStoreId: string,
    requestId: string,
    tokenData?: AssistantCompletionTokenData,
  ): Promise<void> {
    return write(conversationStoreId, (conversation) => {
      const assistant = conversation.exchanges.find(
        (exchange) =>
          exchange.requestId === requestId && exchange.role === 'assistant',
      );
      if (assistant) {
        conversationStore.patchAssistantExchange(
          conversationStoreId,
          requestId,
          buildAssistantCompletionPatch(
            conversation.exchanges,
            requestId,
            tokenData,
          ),
          true,
        );
      } else {
        conversationStore.touchConversation(conversationStoreId);
      }

      const merged = resolveMergedSourceExchanges(conversation, requestId);
      if (merged) {
        conversationStore.consumeMergedSources(
          conversationStoreId,
          requestId,
          merged.originRequestIds,
        );
        mergeSelectionStore.resolvePendingMerge(
          conversationStoreId,
          requestId,
          merged.sourceExchangeIds,
        );
      }
      return true;
    });
  }

  function markExchangeError(
    conversationStoreId: string,
    requestId: string,
    errorMessage?: string,
  ): Promise<void> {
    return write(conversationStoreId, (conversation) => {
      const assistant = conversation.exchanges.find(
        (exchange) =>
          exchange.requestId === requestId && exchange.role === 'assistant',
      );
      if (!assistant) return false;

      conversationStore.patchAssistantExchange(
        conversationStoreId,
        requestId,
        {
          status: 'error',
          ...(errorMessage ? { content: errorMessage } : {}),
        },
        true,
      );
      const merged = resolveMergedSourceExchanges(conversation, requestId);
      if (merged) {
        mergeSelectionStore.resolvePendingMerge(
          conversationStoreId,
          requestId,
          merged.sourceExchangeIds,
        );
      }
      return true;
    });
  }

  return { markExchangeDone, markExchangeError };
}
