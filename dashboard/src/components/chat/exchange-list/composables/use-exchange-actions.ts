import type { Exchange } from '@/stores/conversation';
import { useConversationStore } from '@/stores/conversation';

import { useSocketStore } from '../../../../stores/socket';
import { createId } from '../../../../utils/id.helper';
import { buildBranchExchanges } from '../helpers/build-branch-exchanges.helper';

export interface ExchangeActions {
  retryExchange: (exchangeId: string) => void;
  deleteExchange: (exchangeId: string) => void;
  branchExchange: (exchangeId: string) => void;
}

/**
 * Wire the orchestrator to the conversation store: delete, retry, and branch an
 * exchange from the active conversation.
 */
export function useExchangeActions(
  retryHandler: (text: string) => Promise<void>,
): ExchangeActions {
  const conversationStore = useConversationStore();

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

  function branchExchange(exchangeId: string) {
    const id = conversationStore.activeConversationId;
    if (!id) return;
    const conversation = conversationStore.getConversation(id);
    if (!conversation) return;
    const idx = conversation.exchanges.findIndex((e) => e.id === exchangeId);
    if (idx === -1) return;

    const userEx = conversation.exchanges[idx];
    const partner = conversation.exchanges[idx + 1];
    const newExchanges: Exchange[] = buildBranchExchanges(userEx, partner);

    conversationStore.createNewConversation('temporary', createId(), '');
    const newSession = conversationStore.getConversation(
      conversationStore.activeConversationId!,
    );
    if (!newSession) return;

    newSession.model = conversation.model;
    newSession.task = conversation.task;
    newSession.numCtx = conversation.numCtx;
    newSession.think = conversation.think;
    newSession.exchanges = newExchanges;
    newSession.title = userEx.content.slice(0, 50) || 'New Conversation';

    const socketStore = useSocketStore();
    socketStore.ensureSocketConnection();
    socketStore.listenToEvent(newSession.event);
    if (newSession.roomId) {
      socketStore.joinRoom(newSession.roomId, newSession.event);
    }
  }

  return {
    retryExchange,
    deleteExchange,
    branchExchange,
  };
}
