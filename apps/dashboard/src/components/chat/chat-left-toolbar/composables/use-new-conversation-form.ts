import { computed, ref } from 'vue';

import { useConversationCatalog } from '@/components/chat/composables/use-conversation-catalog';
import { useSocket } from '@/composables/use-socket/use-socket';
import { createId } from '@/utils/create-id/create-id.helper';

import { useSocketSubscriptions } from './use-socket-subscriptions';

/**
 * The new-conversation menu's draft form and creation action. Module-scope
 * on purpose so the draft survives menu open/close and the prompt-menu's
 * conversation menu shares it across component trees (like
 * `useLeftToolbarView`).
 */
const newConversationName = ref('');
const newConversationEvent = ref('');
const newConversationRoomId = ref('');

export function useNewConversationForm() {
  const catalog = useConversationCatalog();
  const socketStore = useSocket();
  const { subscriptions } = useSocketSubscriptions();

  const availableSocketEvents = computed(() =>
    [
      ...new Set(
        subscriptions.value
          .filter((s) => s.active && s.event)
          .map((s) => s.event),
      ),
    ].sort(),
  );

  /** Rooms known for the event currently entered in the new-conversation menu. */
  const availableRooms = computed(() => {
    const event = newConversationEvent.value;
    return [
      ...new Set(
        subscriptions.value
          .filter((s) => s.active && s.event === event && s.roomId)
          .map((s) => s.roomId),
      ),
    ].sort();
  });

  /**
   * Create a new conversation from the current form values, wiring up the
   * socket connection and subscriptions. A blank event generates a fresh id;
   * a blank roomId joins no room. Clears the form on success.
   */
  function createConversation(type: 'temporary' | 'persistent') {
    const name = newConversationName.value.trim();
    const enteredEvent = newConversationEvent.value.trim();

    const event = enteredEvent || createId();
    const roomId = newConversationRoomId.value.trim() || undefined;

    socketStore.ensureSocketConnection();
    socketStore.listenToEvent(event);
    if (roomId) socketStore.joinRoom(roomId, event);

    const matchedSubscription = subscriptions.value.find(
      (s) => s.event === event && (s.roomId ?? '') === (roomId ?? ''),
    );
    catalog.createNewConversation(type, event, roomId, {
      ...(name ? { title: name } : {}),
      subscriptions: [{ event, roomId: roomId || '' }],
      stream: matchedSubscription?.stream ?? true,
    });

    newConversationName.value = '';
    newConversationEvent.value = '';
    newConversationRoomId.value = '';
  }

  return {
    newConversationName,
    newConversationEvent,
    newConversationRoomId,
    availableSocketEvents,
    availableRooms,
    createConversation,
  };
}
