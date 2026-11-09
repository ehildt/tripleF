import { useConversationCatalog } from '@/components/chat/composables/use-conversation-catalog';
import { useConversationSession } from '@/components/chat/shared/composables/use-conversation-session';
import { buildBranchExchanges } from '@/components/chat/shared/helpers/build-branch-exchanges.helper';
import { useSocket } from '@/composables/use-socket/use-socket';
import type { Exchange } from '@/stores/chat/conversation/conversation.model';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { createId } from '@/utils/create-id/create-id.helper';

import { mapExchangeToNewSession } from './helpers/map-exchange-to-new-session.helper';

/**
 * Branch the active conversation at a user exchange: the exchange and its
 * assistant partner become the seed of a new conversation with the same
 * model/task/context settings, which then becomes the active one.
 * Shared by the exchange header actions and the history panel list.
 */
export function useBranchExchange() {
  const conversationStore = useConversationStore();
  const conversationSession = useConversationSession();
  const catalog = useConversationCatalog();

  function branchExchange(exchangeId: string) {
    const id = conversationSession.activeConversationId.value;
    if (!id) return;
    const conversation = conversationStore.getConversation(id);
    if (!conversation) return;
    const idx = conversation.exchanges.findIndex((e) => e.id === exchangeId);
    if (idx === -1) return;

    const userEx = conversation.exchanges[idx];
    const partner = conversation.exchanges[idx + 1];
    const newExchanges: Exchange[] = buildBranchExchanges(userEx, partner);

    const serverConversationId = createId();
    const newSession = catalog.createNewConversation(
      'temporary',
      createId(),
      '',
      {
        conversationId: serverConversationId,
        model: conversation.model,
        task: conversation.task,
        numCtx: conversation.numCtx,
        think: conversation.think,
        // Re-tag copied exchanges to the new stable id so context deletion
        // cannot remove the branch's seed turn.
        exchanges: newExchanges.map((exchange) =>
          mapExchangeToNewSession(exchange, serverConversationId),
        ),
        title: userEx.content.slice(0, 50) || 'New Conversation',
      },
    );

    const socketStore = useSocket();
    socketStore.ensureSocketConnection();
    socketStore.listenToEvent(newSession.event);
    if (newSession.roomId) {
      socketStore.joinRoom(newSession.roomId, newSession.event);
    }
  }

  return { branchExchange };
}
