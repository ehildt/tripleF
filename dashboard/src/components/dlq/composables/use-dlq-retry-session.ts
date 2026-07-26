import { useConversationStore } from '@/stores/conversation';
import { useDebugStore } from '@/stores/debug';
import { useApiMessagesStore } from '@/stores/messages';
import type { DlqEntry } from '@/types/dlq-entry.model';

import { useToast } from '../../../composables/use-toast';
import { extractPromptMessages } from '../helpers/extract-prompt-messages.helper';

export interface DlqRetrySessionSocket {
  ensureSocketConnection: () => void;
  joinRoom: (roomId: string, eventName: string) => void;
  listenToEvent: (eventName: string) => void;
  connectedEvents: Set<string>;
  connectedRooms: Map<string, Set<string>>;
}

/**
 * Side effects that prepare the app to follow a retried DLQ job: make sure
 * the socket room/event is subscribed, log the retry in the debug store,
 * track the pending API message, and seed the active conversation with the
 * original prompt plus a pending assistant exchange.
 */
export function useDlqRetrySession(socketStore: DlqRetrySessionSocket) {
  const toast = useToast();

  function ensureSocketSubscription(roomId: string, eventName: string) {
    socketStore.ensureSocketConnection();

    if (!socketStore.connectedEvents.has(eventName)) {
      socketStore.listenToEvent(eventName);
      toast.info(`Resubscribed to ${eventName}`);
    }
    if (!(socketStore.connectedRooms.get(eventName)?.has(roomId) ?? false)) {
      socketStore.joinRoom(roomId, eventName);
      toast.info(`Rejoined room: ${roomId}`);
    }
  }

  function populateSessionFromEntry(
    requestId: string,
    roomId: string,
    event: string,
    model: string,
    entry: DlqEntry,
  ) {
    const conversationStore = useConversationStore();
    const conversationId = conversationStore.activeConversationId;
    if (!conversationId) return;
    const conversation = conversationStore.getConversation(conversationId);
    if (!conversation) return;

    if (event) conversation.event = event;
    if (roomId) conversation.roomId = roomId;
    if (model) {
      conversationStore.setModel(conversationId, model);
    }

    const hasExchange = (role: 'user' | 'assistant') =>
      conversation.exchanges.some(
        (e) => e.requestId === requestId && e.role === role,
      );

    if (!hasExchange('user')) {
      for (const msg of extractPromptMessages(entry)) {
        conversationStore.addExchange(conversationId, {
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          requestId,
          status: 'done',
          model,
          event,
          roomId,
        });
      }
    }

    if (!hasExchange('assistant')) {
      conversationStore.addExchange(conversationId, {
        role: 'assistant',
        content: '',
        requestId,
        status: 'pending',
        model,
        event,
        roomId,
      });
    }
  }

  function addRetryPendingMessage(
    requestId: string,
    roomId: string,
    event: string,
    model: string,
    entry?: DlqEntry,
  ) {
    const debugStore = useDebugStore();
    const messagesStore = useApiMessagesStore();
    const conversationStore = useConversationStore();

    debugStore.addDebugResult({
      endpoint: `/api/v1/dlq/${requestId}`,
      method: 'RETRY',
      status: 'success',
      statusCode: 200,
      responseTime: 0,
      type: 'http',
      requestId,
      ...(roomId ? { roomId } : {}),
    });

    const exists = messagesStore.messages.some(
      (m) => m.data.requestId === requestId,
    );
    if (!exists) {
      messagesStore.trackRequest(requestId);
      messagesStore.addPendingMessage(event, roomId, requestId, true);
    }

    if (entry && conversationStore.activeConversationId) {
      populateSessionFromEntry(requestId, roomId, event, model, entry);
    }
  }

  return {
    ensureSocketSubscription,
    addRetryPendingMessage,
  };
}
