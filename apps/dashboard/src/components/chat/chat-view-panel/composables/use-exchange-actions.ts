import { useSubmit } from '@/components/chat/composables/use-submit';
import { useConversationStore } from '@/stores/conversation';

import type { ExchangeActions } from './use-exchange-actions.types';

/**
 * Wire the orchestrator to the conversation store: retry the failed
 * assistant exchange of the active conversation. Delete and branch moved
 * with their icons to the right-toolbar history items (use-history-panel's
 * deleteUserExchange / branchUserExchange). Composes the submit action by
 * import.
 */
export function useExchangeActions(): ExchangeActions {
  const conversationStore = useConversationStore();
  const { submit: retryHandler } = useSubmit();

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
  };
}
