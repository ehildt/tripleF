import { useSocket } from '@/composables/use-socket/use-socket';
import { useAttachedFilesStore } from '@/stores/attached-files/attached-files.store';
import { useConversationStore } from '@/stores/conversation/conversation.store';

import { isSocketEventInUse } from '../shared/helpers/is-socket-event-in-use.helper';
import { isSocketShared } from '../shared/helpers/is-socket-shared.helper';
import { useSocketSubscriptions } from './use-socket-subscriptions';

/**
 * Delete a conversation after leaving every socket it listens on (unless
 * another conversation shares the socket). The event listener itself is
 * detached once nothing uses the event on any room.
 */
export function useDeleteConversation() {
  const conversationStore = useConversationStore();
  const attachedFilesStore = useAttachedFilesStore();
  const socketStore = useSocket();
  const { subscriptions, removeSubscriptionByEventRoom } =
    useSocketSubscriptions();

  async function deleteConversation(id: string) {
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
    conversationStore.setSubscriptions(id, []);

    await conversationStore.deleteCurrentConversation(id);
    attachedFilesStore.clearPendingFilesForConversation(
      id,
      conversation.conversationId,
    );
  }

  return { deleteConversation };
}
