import { useConversationCatalog } from '@/components/chat/composables/use-conversation-catalog';
import { useConversationPersistence } from '@/components/chat/composables/use-conversation-persistence';
import { i18n } from '@/i18n/i18n';
import type {
  Conversation,
  Exchange,
} from '@/stores/chat/conversation/conversation.model';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { prunePairedExchange } from '@/stores/chat/conversation/helpers/prune-paired-exchange.helper';
import { togglePairedExchangeIncluded } from '@/stores/chat/conversation/helpers/toggle-paired-exchange-included.helper';
import { useMergeSelectionStore } from '@/stores/chat/conversation/merge-selection/merge-selection.store';

interface ConversationExchanges {
  addExchange: (
    conversationStoreId: string,
    exchange: Omit<Exchange, 'timestamp' | 'id'>,
  ) => Promise<Exchange | undefined>;
  deleteExchangeAndPrune: (
    conversationStoreId: string,
    exchangeId: string,
  ) => Promise<void>;
  toggleExchangeIncluded: (
    conversationStoreId: string,
    exchangeId: string,
  ) => Promise<void>;
}

/** Own loaded exchange append, paired inclusion, deletion, and persistence. */
export function useConversationExchanges(): ConversationExchanges {
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

  function addExchange(
    conversationStoreId: string,
    exchange: Omit<Exchange, 'timestamp' | 'id'>,
  ): Promise<Exchange | undefined> {
    const apply = () => {
      const added = conversationStore.addExchange(
        conversationStoreId,
        exchange,
        i18n.global.t('common.newConversation'),
      );
      const conversation =
        conversationStore.getConversation(conversationStoreId);
      if (!conversation) return Promise.resolve(added);
      return persistence.persistConversation(conversation).then(() => added);
    };
    const current = conversationStore.getConversation(conversationStoreId);
    if (current?.loaded) return apply();
    return catalog
      .loadConversationForWrite(conversationStoreId)
      .then((conversation) => {
        if (conversation) return apply();
        return undefined;
      });
  }

  function deleteExchangeAndPrune(
    conversationStoreId: string,
    exchangeId: string,
  ): Promise<void> {
    return write(conversationStoreId, (conversation) => {
      const previous = conversation.exchanges;
      const next = prunePairedExchange(previous, exchangeId);
      if (next === previous) return false;

      const remainingIds = new Set(next.map((exchange) => exchange.id));
      const removedIds = previous
        .filter((exchange) => !remainingIds.has(exchange.id))
        .map((exchange) => exchange.id);
      const replaced = conversationStore.replaceExchanges(
        conversationStoreId,
        next,
      );
      if (replaced) {
        mergeSelectionStore.pruneMergeSelection(
          conversationStoreId,
          removedIds,
        );
      }
      return replaced;
    });
  }

  function toggleExchangeIncluded(
    conversationStoreId: string,
    exchangeId: string,
  ): Promise<void> {
    return write(conversationStoreId, (conversation) => {
      const next = togglePairedExchangeIncluded(
        conversation.exchanges,
        exchangeId,
      );
      return next
        ? conversationStore.replaceExchanges(conversationStoreId, next)
        : false;
    });
  }

  return { addExchange, deleteExchangeAndPrune, toggleExchangeIncluded };
}
