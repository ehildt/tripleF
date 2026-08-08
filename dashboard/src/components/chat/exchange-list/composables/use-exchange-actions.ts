import { useConversationStore } from '@/stores/conversation';

import { useBranchExchange } from '../../composables/use-branch-exchange';
import type { ExchangeActions } from './use-exchange-actions.types';

/**
 * Wire the orchestrator to the conversation store: delete, retry, and branch an
 * exchange from the active conversation.
 */
export function useExchangeActions(
  retryHandler: (text: string) => Promise<void>,
): ExchangeActions {
  const conversationStore = useConversationStore();
  const { branchExchange } = useBranchExchange();

  function deleteExchange(exchangeId: string) {
    const id = conversationStore.activeConversationId;
    if (!id) return;
    conversationStore.deleteExchangeAndPrune(id, exchangeId);
  }

  function retryExchange(exchangeId: string) {
    const id = conversationStore.activeConversationId;
    if (!id) return;
    const conversation = conversationStore.getConversation(id);
    if (!conversation) return;
    const idx = conversation.exchanges.findIndex((e) => e.id === exchangeId);
    if (idx < 1) return;
    const prev = conversation.exchanges[idx - 1];
    if (prev.role !== 'user') return;
    conversation.exchanges.splice(idx - 1, 2);
    void retryHandler(prev.content);
  }

  return {
    retryExchange,
    deleteExchange,
    branchExchange,
  };
}
