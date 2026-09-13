import { computed, ref, watch } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import { useSocketStore } from '../../../../../stores/socket';
import { isSocketEventInUse } from '../../conversation-list/helpers/is-socket-event-in-use.helper';
import { isSocketShared } from '../../conversation-list/helpers/is-socket-shared.helper';
import {
  removeSubscriptionByEventRoom,
  subscriptions,
} from './subscriptions.state';

/**
 * Manages the list of conversations.
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

  async function deleteConversation(id: string) {
    releaseConversationSockets(id);
    await conversationStore.deleteCurrentConversation(id);
  }

  return {
    isConversationListExpanded,
    conversationsSortedByUpdated,
    switchToConversation,
    deleteConversation,
  };
}
