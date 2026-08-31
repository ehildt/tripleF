import type { Exchange } from '@/stores/conversation';
import { useConversationStore } from '@/stores/conversation';
import { useSocketStore } from '@/stores/socket';
import { createId } from '@/utils/id.helper';

import { buildBranchExchanges } from '../exchange-list/helpers/build-branch-exchanges.helper';
import { mapExchangeToNewSession } from './helpers/map-exchange-to-new-session.helper';

/**
 * Branch the active conversation at a user exchange: the exchange and its
 * assistant partner become the seed of a new conversation with the same
 * model/task/context settings, which then becomes the active one.
 * Shared by the exchange header actions and the history panel list.
 */
export function useBranchExchange() {
  const conversationStore = useConversationStore();

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
    // The copies still carry the parent conversation's backlink — re-tag
    // them to the new conversation or deletion (which filters exchanges by
    // conversationId) can never empty and remove the branched conversation.
    newSession.exchanges = newExchanges.map((exchange) =>
      mapExchangeToNewSession(exchange, newSession.conversationId),
    );
    newSession.title = userEx.content.slice(0, 50) || 'New Conversation';

    const socketStore = useSocketStore();
    socketStore.ensureSocketConnection();
    socketStore.listenToEvent(newSession.event);
    if (newSession.roomId) {
      socketStore.joinRoom(newSession.roomId, newSession.event);
    }
  }

  return { branchExchange };
}
