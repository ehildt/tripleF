import { computed, ref, watch } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import { useSocketStore } from '../../../../../stores/socket';
import { createId } from '../../../../../utils/id.helper';
import { isSocketEventInUse } from '../../conversation-list/helpers/is-socket-event-in-use.helper';
import { isSocketShared } from '../../conversation-list/helpers/is-socket-shared.helper';
import {
  removeSubscriptionByEventRoom,
  subscriptions,
} from './subscriptions.state';

/**
 * Manages the list of conversations and conversation creation logic.
 * Owns the conversation list expansion state.
 */
export function useConversationList() {
  const conversationStore = useConversationStore();
  const socketStore = useSocketStore();

  // ── Conversation list expansion (persisted) ─────────────────
  const isConversationListExpanded = ref(
    localStorage.getItem('harness-expanded-conversations') === 'true',
  );

  watch(isConversationListExpanded, (v) =>
    localStorage.setItem('harness-expanded-conversations', String(v)),
  );

  // ── Sorted conversations ─────────────────────────────────────
  const conversationsSortedByUpdated = computed(() =>
    [...conversationStore.conversations].sort(
      (a, b) => b.updatedAt - a.updatedAt,
    ),
  );

  // ── New conversation form ─────────────────────────────────────
  const newConversationName = ref('');
  const newConversationEvent = ref('');
  const newConversationRoomId = ref('');

  // ── Conversation actions ──────────────────────────────────────
  function switchToConversation(id: string) {
    conversationStore.setActiveConversation(id);
  }

  /**
   * Leave every socket the conversation listens on — its own binding plus
   * extra subscriptions — unless another conversation shares the socket.
   * The event listener itself is detached once nothing uses the event on
   * any room.
   */
  function releaseConversationSockets(id: string) {
    const conversation = conversationStore.getConversation(id);
    if (!conversation) return;

    const socketBindings = [
      ...(conversation.event
        ? [{ event: conversation.event, roomId: conversation.roomId ?? '' }]
        : []),
      ...(conversation.subscriptions ?? []),
    ];

    for (const { event, roomId } of socketBindings) {
      if (!event) continue;
      if (isSocketShared(conversationStore.conversations, id, event, roomId)) {
        continue;
      }

      if (roomId) socketStore.closeRoom(event, roomId);
      removeSubscriptionByEventRoom(event, roomId);

      if (
        !isSocketEventInUse(
          conversationStore.conversations,
          subscriptions.value,
          id,
          event,
        )
      ) {
        socketStore.closeEvent(event);
      }
    }
    conversation.subscriptions = [];
  }

  function deleteConversation(id: string) {
    releaseConversationSockets(id);
    conversationStore.deleteCurrentConversation(id);
  }

  /**
   * Create a new conversation from the current form values.
   * Wires up the socket connection and subscriptions.
   * A blank event generates a fresh id; a blank roomId joins no room.
   */
  function createNewConversation(
    type: 'temporary' | 'persistent',
    newConversationNameValue: string,
    newConversationEventValue: string,
    newConversationRoomIdValue: string,
  ) {
    const name = newConversationNameValue.trim();
    const enteredEvent = newConversationEventValue.trim();

    const event = enteredEvent || createId();
    const roomId = newConversationRoomIdValue.trim() || undefined;

    socketStore.ensureSocketConnection();
    socketStore.listenToEvent(event);
    if (roomId) socketStore.joinRoom(roomId, event);

    conversationStore.createNewConversation(type, event, roomId);
    if (name) {
      conversationStore.renameConversation(
        conversationStore.activeConversationId!,
        name,
      );
    }

    const newId = conversationStore.activeConversationId;
    if (newId) {
      conversationStore.setSubscriptions(newId, [
        { event, roomId: roomId || '' },
      ]);
    }

    newConversationName.value = '';
    newConversationEvent.value = '';
    newConversationRoomId.value = '';
  }

  return {
    isConversationListExpanded,
    conversationsSortedByUpdated,
    newConversationName,
    newConversationEvent,
    newConversationRoomId,
    switchToConversation,
    deleteConversation,
    createNewConversation,
  };
}
