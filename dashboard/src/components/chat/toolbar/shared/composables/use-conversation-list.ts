import { computed, ref, watch } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import { useSocketStore } from '../../../../../stores/socket';
import { createId } from '../../../../../utils/id.helper';
import { parseSocketBinding } from '../../conversation-list/helpers/parse-socket-binding.helper';
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
  const newConversationSocketBinding = ref('');

  // ── Conversation actions ──────────────────────────────────────
  function switchToConversation(id: string) {
    conversationStore.setActiveConversation(id);
  }

  function deleteConversation(id: string) {
    const conversation = conversationStore.getConversation(id);
    if (conversation) {
      for (const sub of conversation.subscriptions ?? []) {
        const { event, roomId } = sub;
        if (roomId) socketStore.leaveRoom(roomId, event);
        removeSubscriptionByEventRoom(event, roomId);
        const stillNeeded =
          subscriptions.value.some((s) => s.event === event) ||
          conversationStore.conversations.some(
            (c) =>
              c.id !== id &&
              (c.event === event ||
                c.subscriptions?.some((s) => s.event === event)),
          );
        if (!stillNeeded) {
          socketStore.closeEvent(event);
        }
      }
      conversation.subscriptions = [];
    }
    conversationStore.deleteCurrentConversation(id);
  }

  /**
   * Create a new conversation from the current form values.
   * Wires up the socket connection and subscriptions.
   */
  function createNewConversation(
    type: 'temporary' | 'persistent',
    newConversationNameValue: string,
    newConversationSocketBindingValue: string,
  ) {
    const name = newConversationNameValue.trim();

    let event: string;
    let roomId: string | undefined;
    const parsed = parseSocketBinding(newConversationSocketBindingValue);
    if (parsed.event) {
      event = parsed.event;
      roomId = parsed.roomId || undefined;
    } else {
      event = createId();
      roomId = undefined;
    }

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
  }

  return {
    isConversationListExpanded,
    conversationsSortedByUpdated,
    newConversationName,
    newConversationSocketBinding,
    switchToConversation,
    deleteConversation,
    createNewConversation,
  };
}
